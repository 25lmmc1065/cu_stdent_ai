const { query } = require('../config/database');

const getDepartmentComplaints = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const deptResult = await query(
      `SELECT d.id FROM departments d
       JOIN users u ON u.email ILIKE d.head_email WHERE u.id = $1`,
      [req.user.id]
    );

    let departmentId = null;
    if (deptResult.rows.length > 0) {
      departmentId = deptResult.rows[0].id;
    }

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (departmentId) {
      conditions.push(`c.department_id = $${paramIndex++}`);
      params.push(departmentId);
    }

    if (status) {
      conditions.push(`c.status = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM complaints c ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT c.*, u.name AS student_name
       FROM complaints c
       LEFT JOIN students s ON s.id = c.student_id
       LEFT JOIN users u ON u.id = s.user_id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      complaints: result.rows,
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

const getStats = async (req, res, next) => {
  try {
    const deptResult = await query(
      `SELECT d.id FROM departments d
       JOIN users u ON u.email ILIKE d.head_email WHERE u.id = $1`,
      [req.user.id]
    );

    const departmentId = deptResult.rows.length > 0 ? deptResult.rows[0].id : null;
    const params = departmentId ? [departmentId] : [];
    const condition = departmentId ? 'WHERE department_id = $1' : '';

    const statusResult = await query(
      `SELECT status, COUNT(*) as count FROM complaints ${condition} GROUP BY status`,
      params
    );

    const avgResult = await query(
      `SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) AS avg_resolution_hours
       FROM complaints
       ${condition ? condition + ' AND' : 'WHERE'} resolved_at IS NOT NULL`,
      params
    );

    res.json({
      byStatus: statusResult.rows,
      avgResolutionHours: parseFloat(avgResult.rows[0].avg_resolution_hours) || 0,
    });
  } catch (err) {
    next(err);
  }
};

const updateComplaint = async (req, res, next) => {
  try {
    const { status, department_response } = req.body;

    const result = await query(
      `UPDATE complaints
       SET status = COALESCE($1, status),
           department_response = COALESCE($2, department_response),
           updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status || null, department_response || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, 'UPDATE_COMPLAINT', 'complaint', $2, $3::jsonb, $4)`,
      [req.user.id, req.params.id, JSON.stringify({ status, department_response }), req.ip]
    );

    res.json({ complaint: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDepartmentComplaints, getStats, updateComplaint };
