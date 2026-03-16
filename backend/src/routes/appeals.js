const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { createAppeal, getAppeals, getAppealById, resolveAppeal } = require('../controllers/appealController');

router.post('/', authenticate, requireRole('student'), createAppeal);
router.get('/', authenticate, getAppeals);
router.get('/:id', authenticate, getAppealById);
router.patch('/:id/resolve', authenticate, requireRole('admin', 'pvc'), resolveAppeal);

module.exports = router;
