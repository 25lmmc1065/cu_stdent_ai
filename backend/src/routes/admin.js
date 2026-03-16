const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getAllUsers, getDepartments, getSystemStats, assignComplaint, exportReport } = require('../controllers/adminController');

router.get('/users', authenticate, requireRole('admin', 'pvc'), getAllUsers);
router.get('/departments', authenticate, requireRole('admin', 'pvc'), getDepartments);
router.get('/stats', authenticate, requireRole('admin', 'pvc'), getSystemStats);
router.patch('/complaints/:id/assign', authenticate, requireRole('admin', 'pvc'), assignComplaint);
router.get('/export', authenticate, requireRole('admin', 'pvc'), exportReport);

module.exports = router;
