const { query } = require('../config/database');
const { analyzeComplaint } = require('../services/geminiService');
const { sendComplaintConfirmation, sendStatusUpdate } = require('../services/emailService');

const createComplaint = async (req, res, next) => {
  try {
    const { title, description, category, language } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'title and description are required' });
    }

    const studentResult = await query(
      'SELECT id FROM students WHERE user_id = $1',
      [req.user.id]
    );
    if (studentResult.rows.length === 0) {
      return res.status(403).json({ error: 'Only students can submit complaints' });
    }
    const studentId = studentResult.rows[0].id;

    const attachments = req.files ? req.files.map((f) => f.path) : [];

    const aiAnalysis = await analyzeComplaint(title, description, language || 'en');

    const deptResult = await query(
      'SELECT id FROM departments WHERE name ILIKE $1',
      [aiAnalysis.category]
    );
    const departmentId = deptResult.rows.length > 0 ? deptResult.rows[0].id : null;

    const result = await query(
      `INSERT INTO complaints
         (student_id, title, description, category, department_id, priority, status, language, ai_analysis, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8::jsonb, $9)
       RETURNING *`,
      [
        studentId,
        title,
        description,
        category || aiAnalysis.category,
        departmentId,
        aiAnalysis.priority,
        language || 'en',
        JSON.stringify(aiAnalysis),
        attachments,
      ]
    );

    const complaint = result.rows[0];

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, 'CREATE_COMPLAINT', 'complaint', $2, $3::jsonb, $4)`,
      [req.user.id, complaint.id, JSON.stringify({ title }), req.ip]
    );

    sendComplaintConfirmation(req.user.email, complaint.id, complaint.title);

    res.status(201).json({ complaint });
  } catch (err) {
    next(err);
  }
};

const getComplaints = async (req, res, next) => {
  try {
    const { status, category, startDate, endDate, search, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (req.user.role === 'student') {
      const studentResult = await query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
      if (studentResult.rows.length === 0) {
        return res.json({ complaints: [], pagination: { total: 0, page: 1, limit: parseInt(limit), totalPages: 0 } });
      }
      conditions.push(`c.student_id = $${paramIndex++}`);
      params.push(studentResult.rows[0].id);
    } else if (req.user.role === 'department') {
      const deptUserResult = await query(
        `SELECT d.id FROM departments d
         JOIN users u ON u.email ILIKE d.head_email WHERE u.id = $1`,
        [req.user.id]
      );
      if (deptUserResult.rows.length > 0) {
        conditions.push(`c.department_id = $${paramIndex++}`);
        params.push(deptUserResult.rows[0].id);
      }
    }

    if (status) {
      conditions.push(`c.status = $${paramIndex++}`);
      params.push(status);
    }
    if (category) {
      conditions.push(`c.category ILIKE $${paramIndex++}`);
      params.push(`%${category}%`);
    }
    if (startDate) {
      conditions.push(`c.created_at >= $${paramIndex++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`c.created_at <= $${paramIndex++}`);
      params.push(endDate);
    }
    if (search) {
      conditions.push(`(c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM complaints c ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const complaints = await query(
      `SELECT c.*, d.name AS department_name, u.name AS student_name
       FROM complaints c
       LEFT JOIN departments d ON d.id = c.department_id
       LEFT JOIN students s ON s.id = c.student_id
       LEFT JOIN users u ON u.id = s.user_id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      complaints: complaints.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getComplaintById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*, d.name AS department_name, u.name AS student_name, u.email AS student_email
       FROM complaints c
       LEFT JOIN departments d ON d.id = c.department_id
       LEFT JOIN students s ON s.id = c.student_id
       LEFT JOIN users u ON u.id = s.user_id
       WHERE c.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = result.rows[0];

    if (req.user.role === 'student') {
      const studentResult = await query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
      if (studentResult.rows.length === 0 || complaint.student_id !== studentResult.rows[0].id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const feedbackResult = await query(
      'SELECT * FROM feedback WHERE complaint_id = $1',
      [complaint.id]
    );

    res.json({ complaint: { ...complaint, feedback: feedbackResult.rows } });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, response } = req.body;
    const validStatuses = ['pending', 'in_progress', 'resolved', 'rejected', 'escalated'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }

    const existing = await query('SELECT * FROM complaints WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const resolvedAt = status === 'resolved' ? new Date() : null;
    const result = await query(
      `UPDATE complaints
       SET status = $1, department_response = COALESCE($2, department_response),
           updated_at = NOW(), resolved_at = $3
       WHERE id = $4
       RETURNING *`,
      [status, response || null, resolvedAt, req.params.id]
    );

    const complaint = result.rows[0];

    const studentUserResult = await query(
      'SELECT u.id, u.email FROM users u JOIN students s ON s.user_id = u.id WHERE s.id = $1',
      [complaint.student_id]
    );

    if (studentUserResult.rows.length > 0) {
      const studentUser = studentUserResult.rows[0];
      await query(
        `INSERT INTO notifications (user_id, type, message)
         VALUES ($1, 'STATUS_UPDATE', $2)`,
        [studentUser.id, `Your complaint status has been updated to: ${status}`]
      );
      sendStatusUpdate(studentUser.email, complaint.id, status, response);
    }

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, 'UPDATE_STATUS', 'complaint', $2, $3::jsonb, $4)`,
      [req.user.id, complaint.id, JSON.stringify({ status, response }), req.ip]
    );

    res.json({ complaint });
  } catch (err) {
    next(err);
  }
};

const addNote = async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note) {
      return res.status(400).json({ error: 'note is required' });
    }

    const result = await query(
      `UPDATE complaints SET internal_notes = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [note, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json({ complaint: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const addResponse = async (req, res, next) => {
  try {
    const { response } = req.body;
    if (!response) {
      return res.status(400).json({ error: 'response is required' });
    }

    const result = await query(
      `UPDATE complaints
       SET department_response = $1, status = 'in_progress', updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [response, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = result.rows[0];

    const studentUserResult = await query(
      'SELECT u.id FROM users u JOIN students s ON s.user_id = u.id WHERE s.id = $1',
      [complaint.student_id]
    );

    if (studentUserResult.rows.length > 0) {
      await query(
        `INSERT INTO notifications (user_id, type, message)
         VALUES ($1, 'DEPARTMENT_RESPONSE', $2)`,
        [studentUserResult.rows[0].id, 'The department has responded to your complaint.']
      );
    }

    res.json({ complaint });
  } catch (err) {
    next(err);
  }
};

const submitFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }

    const studentResult = await query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
    if (studentResult.rows.length === 0) {
      return res.status(403).json({ error: 'Only students can submit feedback' });
    }
    const studentId = studentResult.rows[0].id;

    const complaintResult = await query(
      'SELECT id, status, student_id FROM complaints WHERE id = $1',
      [req.params.id]
    );

    if (complaintResult.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaintResult.rows[0];
    if (complaint.student_id !== studentId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (complaint.status !== 'resolved') {
      return res.status(400).json({ error: 'Feedback can only be submitted for resolved complaints' });
    }

    const existing = await query(
      'SELECT id FROM feedback WHERE complaint_id = $1 AND student_id = $2',
      [complaint.id, studentId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Feedback already submitted' });
    }

    const result = await query(
      `INSERT INTO feedback (complaint_id, student_id, rating, comment)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [complaint.id, studentId, rating, comment || null]
    );

    res.status(201).json({ feedback: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateStatus,
  addNote,
  addResponse,
  submitFeedback,
};
