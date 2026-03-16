const { query } = require('../config/database');
const { sendAppealUpdate } = require('../services/emailService');

const createAppeal = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'reason is required' });
    }

    const studentResult = await query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
    if (studentResult.rows.length === 0) {
      return res.status(403).json({ error: 'Only students can create appeals' });
    }
    const studentId = studentResult.rows[0].id;

    const complaintResult = await query(
      `SELECT id, student_id, status FROM complaints WHERE id = $1`,
      [req.params.complaintId || req.body.complaintId]
    );

    if (complaintResult.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaintResult.rows[0];
    if (complaint.student_id !== studentId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!['resolved', 'rejected'].includes(complaint.status)) {
      return res.status(400).json({ error: 'Appeals can only be filed for resolved or rejected complaints' });
    }

    const existing = await query(
      'SELECT id FROM appeals WHERE complaint_id = $1 AND student_id = $2',
      [complaint.id, studentId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Appeal already filed for this complaint' });
    }

    const result = await query(
      `INSERT INTO appeals (complaint_id, student_id, reason)
       VALUES ($1, $2, $3) RETURNING *`,
      [complaint.id, studentId, reason]
    );

    res.status(201).json({ appeal: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const getAppeals = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (req.user.role === 'student') {
      const studentResult = await query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
      if (studentResult.rows.length === 0) {
        return res.json({ appeals: [], pagination: { total: 0, page: 1, limit: parseInt(limit), totalPages: 0 } });
      }
      conditions.push(`a.student_id = $${paramIndex++}`);
      params.push(studentResult.rows[0].id);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM appeals a ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT a.*, c.title AS complaint_title, c.status AS complaint_status
       FROM appeals a
       JOIN complaints c ON c.id = a.complaint_id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      appeals: result.rows,
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

const getAppealById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, c.title AS complaint_title, c.status AS complaint_status,
              u.name AS student_name, u.email AS student_email
       FROM appeals a
       JOIN complaints c ON c.id = a.complaint_id
       JOIN students s ON s.id = a.student_id
       JOIN users u ON u.id = s.user_id
       WHERE a.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appeal not found' });
    }

    const appeal = result.rows[0];

    if (req.user.role === 'student') {
      const studentResult = await query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
      if (studentResult.rows.length === 0 || appeal.student_id !== studentResult.rows[0].id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ appeal });
  } catch (err) {
    next(err);
  }
};

const resolveAppeal = async (req, res, next) => {
  try {
    const { status, admin_response } = req.body;
    const validStatuses = ['approved', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Valid status (approved/rejected) is required' });
    }

    const result = await query(
      `UPDATE appeals
       SET status = $1, admin_response = $2, resolved_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, admin_response || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appeal not found' });
    }

    const appeal = result.rows[0];

    const studentUserResult = await query(
      'SELECT u.id, u.email FROM users u JOIN students s ON s.user_id = u.id WHERE s.id = $1',
      [appeal.student_id]
    );

    if (studentUserResult.rows.length > 0) {
      const studentUser = studentUserResult.rows[0];
      await query(
        `INSERT INTO notifications (user_id, type, message)
         VALUES ($1, 'APPEAL_UPDATE', $2)`,
        [studentUser.id, `Your appeal has been ${status}.`]
      );
      sendAppealUpdate(studentUser.email, appeal.id, status);
    }

    res.json({ appeal });
  } catch (err) {
    next(err);
  }
};

module.exports = { createAppeal, getAppeals, getAppealById, resolveAppeal };
