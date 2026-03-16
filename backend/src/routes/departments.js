const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getDepartmentComplaints, getStats, updateComplaint } = require('../controllers/departmentController');

router.get('/complaints', authenticate, requireRole('department', 'admin', 'pvc'), getDepartmentComplaints);
router.get('/stats', authenticate, requireRole('department', 'admin', 'pvc'), getStats);
router.patch('/complaints/:id', authenticate, requireRole('department', 'admin'), updateComplaint);

module.exports = router;
