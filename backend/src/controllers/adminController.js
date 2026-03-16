const { query } = require('../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (role) {
      conditions.push(`role = $${paramIndex++}`);
      params.push(role);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT id, email, role, name, phone, created_at, is_active
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      users: result.rows,
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

const getDepartments = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT d.*, COUNT(c.id) AS complaint_count
       FROM departments d
       LEFT JOIN complaints c ON c.department_id = d.id
       GROUP BY d.id
       ORDER BY d.name`
    );
    res.json({ departments: result.rows });
  } catch (err) {
    next(err);
  }
};

const getSystemStats = async (req, res, next) => {
  try {
    const [statusResult, roleResult, deptResult] = await Promise.all([
      query('SELECT status, COUNT(*) AS count FROM complaints GROUP BY status'),
      query('SELECT role, COUNT(*) AS count FROM users GROUP BY role'),
      query('SELECT COUNT(*) AS count FROM departments'),
    ]);

    res.json({
      complaintsByStatus: statusResult.rows,
      usersByRole: roleResult.rows,
      totalDepartments: parseInt(deptResult.rows[0].count),
    });
  } catch (err) {
    next(err);
  }
};

const assignComplaint = async (req, res, next) => {
  try {
    const { departmentId } = req.body;
    if (!departmentId) {
      return res.status(400).json({ error: 'departmentId is required' });
    }

    const deptCheck = await query('SELECT id FROM departments WHERE id = $1', [departmentId]);
    if (deptCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const result = await query(
      `UPDATE complaints SET department_id = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [departmentId, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, 'ASSIGN_COMPLAINT', 'complaint', $2, $3::jsonb, $4)`,
      [req.user.id, req.params.id, JSON.stringify({ departmentId }), req.ip]
    );

    res.json({ complaint: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const exportReport = async (req, res, next) => {
  try {
    const { format = 'excel' } = req.query;

    const result = await query(
      `SELECT c.id, c.title, c.status, c.priority, d.name AS department, c.created_at
       FROM complaints c
       LEFT JOIN departments d ON d.id = c.department_id
       ORDER BY c.created_at DESC`
    );

    const complaints = result.rows;

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="complaints-report.pdf"');
      doc.pipe(res);

      doc.fontSize(20).text('Complaints Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
      doc.moveDown(2);

      complaints.forEach((c, i) => {
        doc.fontSize(12).text(`${i + 1}. ${c.title}`);
        doc.fontSize(10)
          .text(`   ID: ${c.id}`)
          .text(`   Status: ${c.status} | Priority: ${c.priority}`)
          .text(`   Department: ${c.department || 'Unassigned'}`)
          .text(`   Created: ${new Date(c.created_at).toLocaleDateString()}`);
        doc.moveDown();
      });

      doc.end();
    } else {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Complaints');

      sheet.columns = [
        { header: 'ID', key: 'id', width: 38 },
        { header: 'Title', key: 'title', width: 40 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Priority', key: 'priority', width: 12 },
        { header: 'Department', key: 'department', width: 30 },
        { header: 'Created At', key: 'created_at', width: 22 },
      ];

      sheet.getRow(1).font = { bold: true };

      complaints.forEach((c) => {
        sheet.addRow({
          id: c.id,
          title: c.title,
          status: c.status,
          priority: c.priority,
          department: c.department || 'Unassigned',
          created_at: new Date(c.created_at).toISOString(),
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="complaints-report.xlsx"');
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getDepartments, getSystemStats, assignComplaint, exportReport };
