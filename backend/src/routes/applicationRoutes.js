const express = require('express');
const router = express.Router();
const {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  addHRNote,
  editHRNote,
  deleteHRNote,
  exportApplications,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const { applicationValidationRules, validateResults } = require('../middleware/validationMiddleware');

// Public candidate submission endpoint - Multer fields parser runs first to load body details
router.post(
  '/',
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
  ]),
  applicationValidationRules,
  validateResults,
  createApplication
);

// Protected Admin endpoints
router.get('/', protect, getApplications);
router.get('/export', protect, exportApplications); // Declared before /:id to avoid collision
router.get('/:id', protect, getApplicationById);
router.put('/:id/status', protect, updateApplicationStatus);
router.delete('/:id', protect, deleteApplication);

// HR Notes sub-routes
router.post('/:id/notes', protect, addHRNote);
router.put('/:id/notes/:noteId', protect, editHRNote);
router.delete('/:id/notes/:noteId', protect, deleteHRNote);

module.exports = router;
