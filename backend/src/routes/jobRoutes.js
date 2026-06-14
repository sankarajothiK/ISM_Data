const express = require('express');
const router = express.Router();
const {
  createJob,
  getActiveJobs,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
} = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');
const { jobValidationRules, validateResults } = require('../middleware/validationMiddleware');

// Public endpoints
router.get('/', getActiveJobs);
router.get('/:id', getJobById);

// Protected Admin endpoints
router.get('/all/list', protect, getAllJobs); // Renamed path to prevent conflicts
router.post('/', protect, jobValidationRules, validateResults, createJob);
router.put('/:id', protect, jobValidationRules, validateResults, updateJob);
router.delete('/:id', protect, deleteJob);

module.exports = router;
