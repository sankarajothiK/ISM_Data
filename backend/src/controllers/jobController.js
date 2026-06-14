const Job = require('../models/Job');

// @desc    Create a new job opening
// @route   POST /api/jobs
// @access  Private (Admin)
const createJob = async (req, res, next) => {
  try {
    const { title, department, description, experienceRequired, salaryRange, status } = req.body;

    const job = await Job.create({
      title,
      department,
      description,
      experienceRequired,
      salaryRange,
      status: status || 'active',
    });

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get only active jobs (For candidates)
// @route   GET /api/jobs
// @access  Public
const getActiveJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ status: 'active' }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all jobs (For admin including inactive ones)
// @route   GET /api/jobs/all
// @access  Private (Admin)
const getAllJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({}).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a job opening
// @route   PUT /api/jobs/:id
// @access  Private (Admin)
const updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a job opening
// @route   DELETE /api/jobs/:id
// @access  Private (Admin)
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Job removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  getActiveJobs,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
};
