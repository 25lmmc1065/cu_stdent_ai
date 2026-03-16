const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimit');
const upload = require('../middleware/upload');
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateStatus,
  addNote,
  addResponse,
  submitFeedback,
} = require('../controllers/complaintController');

router.post('/', authenticate, requireRole('student'), uploadLimiter, upload.array('attachments', 5), createComplaint);
router.get('/', authenticate, getComplaints);
router.get('/:id', authenticate, getComplaintById);
router.patch('/:id/status', authenticate, requireRole('department', 'admin', 'pvc'), updateStatus);
router.post('/:id/notes', authenticate, requireRole('department', 'admin'), addNote);
router.post('/:id/response', authenticate, requireRole('department', 'admin'), addResponse);
router.post('/:id/feedback', authenticate, requireRole('student'), submitFeedback);

module.exports = router;
