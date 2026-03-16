const { query } = require('../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const getComplaintStats = async (req, res, next) => {
  try {
    let deptCondition = '';
    let deptParams = [];

    if (req.user.role === 'department') {
      const deptResult = await query(
        `SELECT d.id FROM departments d JOIN users u ON u.email ILIKE d.head_email WHERE u.id = $1`,
        [req.user.id]
      );
      if (deptResult.rows.length > 0) {
        deptCondition = 'WHERE c.department_id = $1';
        deptParams = [deptResult.rows[0].id];
      }
    }

    const [totalResult, byStatus, byDept, byPriority] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM complaints c ${deptCondition}`, deptParams),
      query(`SELECT status, COUNT(*) AS count FROM complaints c ${deptCondition} GROUP BY status`, deptParams),
      query(
        `SELECT d.name AS department, COUNT(c.id) AS count
         FROM departments d
         LEFT JOIN complaints c ON c.department_id = d.id
         GROUP BY d.name ORDER BY count DESC`
      ),
      query(`SELECT priority, COUNT(*) AS count FROM complaints c ${deptCondition} GROUP BY priority`, deptParams),
    ]);

    res.json({
      total: parseInt(totalResult.rows[0].total),
      byStatus: byStatus.rows,
      byDepartment: byDept.rows,
      byPriority: byPriority.rows,
    });
  } catch (err) {
    next(err);
  }
};

const getDepartmentPerformance = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         d.id,
         d.name AS department,
         COUNT(c.id) AS total_complaints,
         COUNT(CASE WHEN c.status = 'resolved' THEN 1 END) AS resolved_count,
         AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at))/3600) FILTER (WHERE c.resolved_at IS NOT NULL) AS avg_resolution_hours,
         AVG(f.rating) AS avg_rating
       FROM departments d
       LEFT JOIN complaints c ON c.department_id = d.id
       LEFT JOIN feedback f ON f.complaint_id = c.id
       GROUP BY d.id, d.name
       ORDER BY d.name`
    );

    res.json({ performance: result.rows });
  } catch (err) {
    next(err);
  }
};

const getTrends = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;

    const periodMap = {
      daily: { truncUnit: 'day', interval: '30 days' },
      weekly: { truncUnit: 'week', interval: '12 weeks' },
      monthly: { truncUnit: 'month', interval: '12 months' },
    };
    const { truncUnit, interval } = periodMap[period] || periodMap.monthly;

    const result = await query(
      `SELECT
         DATE_TRUNC($1, created_at) AS date,
         COUNT(*) AS count
       FROM complaints
       WHERE created_at >= NOW() - $2::interval
       GROUP BY DATE_TRUNC($1, created_at)
       ORDER BY date ASC`,
      [truncUnit, interval]
    );

    res.json({ trends: result.rows, period });
  } catch (err) {
    next(err);
  }
};

const exportReport = async (req, res, next) => {
  try {
    const { format = 'excel' } = req.query;

    const [statsResult, perfResult, trendsResult] = await Promise.all([
      query('SELECT status, COUNT(*) AS count FROM complaints GROUP BY status'),
      query(
        `SELECT d.name AS department, COUNT(c.id) AS total,
                COUNT(CASE WHEN c.status = 'resolved' THEN 1 END) AS resolved,
                AVG(f.rating) AS avg_rating
         FROM departments d
         LEFT JOIN complaints c ON c.department_id = d.id
         LEFT JOIN feedback f ON f.complaint_id = c.id
         GROUP BY d.name ORDER BY d.name`
      ),
      query(
        `SELECT DATE_TRUNC('month', created_at) AS date, COUNT(*) AS count
         FROM complaints
         WHERE created_at >= NOW() - INTERVAL '12 months'
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY date ASC`
      ),
    ]);

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.pdf"');
      doc.pipe(res);

      doc.fontSize(20).text('Analytics Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(14).text('Complaints by Status');
      doc.moveDown(0.5);
      statsResult.rows.forEach((r) => {
        doc.fontSize(10).text(`  ${r.status}: ${r.count}`);
      });
      doc.moveDown();

      doc.fontSize(14).text('Department Performance');
      doc.moveDown(0.5);
      perfResult.rows.forEach((r) => {
        doc.fontSize(10).text(`  ${r.department}: ${r.total} total, ${r.resolved} resolved, avg rating: ${parseFloat(r.avg_rating || 0).toFixed(2)}`);
      });
      doc.moveDown();

      doc.fontSize(14).text('Monthly Trends (last 12 months)');
      doc.moveDown(0.5);
      trendsResult.rows.forEach((r) => {
        doc.fontSize(10).text(`  ${new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}: ${r.count}`);
      });

      doc.end();
    } else {
      const workbook = new ExcelJS.Workbook();

      const statsSheet = workbook.addWorksheet('Stats');
      statsSheet.columns = [
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Count', key: 'count', width: 15 },
      ];
      statsSheet.getRow(1).font = { bold: true };
      statsResult.rows.forEach((r) => statsSheet.addRow(r));

      const perfSheet = workbook.addWorksheet('Department Performance');
      perfSheet.columns = [
        { header: 'Department', key: 'department', width: 30 },
        { header: 'Total', key: 'total', width: 12 },
        { header: 'Resolved', key: 'resolved', width: 12 },
        { header: 'Avg Rating', key: 'avg_rating', width: 15 },
      ];
      perfSheet.getRow(1).font = { bold: true };
      perfResult.rows.forEach((r) => perfSheet.addRow(r));

      const trendsSheet = workbook.addWorksheet('Trends');
      trendsSheet.columns = [
        { header: 'Month', key: 'date', width: 20 },
        { header: 'Count', key: 'count', width: 12 },
      ];
      trendsSheet.getRow(1).font = { bold: true };
      trendsResult.rows.forEach((r) =>
        trendsSheet.addRow({ date: new Date(r.date).toLocaleDateString(), count: r.count })
      );

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.xlsx"');
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { getComplaintStats, getDepartmentPerformance, getTrends, exportReport };
