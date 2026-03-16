const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getComplaintStats, getDepartmentPerformance, getTrends, exportReport } = require('../controllers/analyticsController');

router.get('/stats', authenticate, getComplaintStats);
router.get('/performance', authenticate, requireRole('admin', 'pvc', 'department'), getDepartmentPerformance);
router.get('/trends', authenticate, getTrends);
router.get('/export', authenticate, requireRole('admin', 'pvc'), exportReport);

module.exports = router;
