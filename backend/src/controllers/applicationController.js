const Application = require('../models/Application');
const Job = require('../models/Job');
const XLSX = require('xlsx');
const { cloudinary } = require('../config/cloudinary');
const { sendCandidateConfirmationEmail, sendAdminNotificationEmail } = require('../utils/emailService');


// Helper function to extract Cloudinary public ID from URL to delete it
const getCloudinaryPublicId = (url) => {
  if (!url) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const publicIdWithVersion = parts[1];
    const versionParts = publicIdWithVersion.split('/');
    let cleanPath = '';
    if (versionParts[0].startsWith('v') && !isNaN(versionParts[0].substring(1))) {
      cleanPath = versionParts.slice(1).join('/');
    } else {
      cleanPath = versionParts.join('/');
    }
    // Remove file extension
    return cleanPath.split('.').slice(0, -1).join('.');
  } catch (err) {
    console.error('Error parsing Cloudinary URL publicId:', err);
    return null;
  }
};

// Helper: Parse skill/certification fields (can be arrays or comma-separated strings)
const parseCommaOrArray = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((i) => i.trim());
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) return parsed.map((i) => i.trim());
  } catch (e) {
    // Treat as comma separated string
  }
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

// Helper: Construct MongoDB search/filter query object from request queries
const buildFilterQuery = (queryParams) => {
  const query = {};

  // Text search (Name, Mobile, Email)
  if (queryParams.search) {
    const searchRegex = new RegExp(queryParams.search, 'i');
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { mobile: searchRegex },
    ];
  }

  // Exact Match Filters
  if (queryParams.positionApplied) {
    query.preferredJobRole = queryParams.positionApplied; // Map positionApplied filter to preferredJobRole
  }
  if (queryParams.status) {
    query.status = queryParams.status;
  }
  if (queryParams.experienceType) {
    query.experienceType = queryParams.experienceType;
  }

  // Date Filters (appliedAt range)
  if (queryParams.startDate || queryParams.endDate) {
    query.createdAt = {};
    if (queryParams.startDate) {
      query.createdAt.$gte = new Date(queryParams.startDate);
    }
    if (queryParams.endDate) {
      const endOfDay = new Date(queryParams.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endOfDay;
    }
  }

  return query;
};

// @desc    Submit job application (Candidate)
// @route   POST /api/applications
// @access  Public
const createApplication = async (req, res, next) => {
  try {
    // Validate job exists and is active
    const job = await Job.findOne({ title: req.body.preferredJobRole, status: 'active' });
    if (!job) {
      return res.status(400).json({
        success: false,
        message: 'The job role you selected is either inactive or does not exist.',
      });
    }

    // Check for duplicate application (email or mobile already registered)
    const duplicateApp = await Application.findOne({
      $or: [
        { email: req.body.email.toLowerCase() },
        { mobile: req.body.mobile },
      ],
    });

    if (duplicateApp) {
      // Clean up uploaded files immediately to prevent storage leak
      if (req.files) {
        const resumeFile = req.files?.['resume']?.[0];
        const photoFile = req.files?.['photo']?.[0];
        if (resumeFile) {
          const publicId = getCloudinaryPublicId(resumeFile.path);
          if (publicId) cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(e => console.error(e));
        }
        if (photoFile) {
          const publicId = getCloudinaryPublicId(photoFile.path);
          if (publicId) cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(e => console.error(e));
        }
      }
      return res.status(400).json({
        success: false,
        message: 'An application with this email address or mobile number has already been registered.',
      });
    }

    // Check resume is present
    const resumeFile = req.files?.['resume']?.[0];
    const photoFile = req.files?.['photo']?.[0];

    if (!resumeFile) {
      return res.status(400).json({
        success: false,
        message: 'Resume upload document is required.',
      });
    }

    // Parse skills and languages
    const technicalSkills = parseCommaOrArray(req.body.technicalSkills);
    const softSkills = parseCommaOrArray(req.body.softSkills);
    const languagesKnown = parseCommaOrArray(req.body.languagesKnown);

    // Create Application Schema record
    const application = await Application.create({
      name: req.body.name,
      mobile: req.body.mobile,
      whatsappNumber: req.body.whatsappNumber,
      email: req.body.email,
      gender: req.body.gender,
      dob: req.body.dob,
      currentLocation: req.body.currentLocation,
      
      qualification: req.body.qualification,
      degreeCourse: req.body.degreeCourse,
      college: req.body.college,
      passingYear: Number(req.body.passingYear),
      percentage: req.body.percentage,

      preferredJobRole: req.body.preferredJobRole,
      preferredLocation: req.body.preferredLocation,
      expectedSalary: req.body.expectedSalary,
      willingToRelocate: req.body.willingToRelocate,
      preferredShift: req.body.preferredShift,

      experienceType: req.body.experienceType,
      yearsOfExperience: req.body.yearsOfExperience ? Number(req.body.yearsOfExperience) : 0,
      currentCompany: req.body.currentCompany || '',
      currentJobRole: req.body.currentJobRole || '',
      currentSalary: req.body.currentSalary || '',
      noticePeriod: req.body.noticePeriod,

      technicalSkills,
      softSkills,
      languagesKnown,

      resumeUrl: resumeFile.path, // Cloudinary URL
      photoUrl: photoFile ? photoFile.path : '', // Optional Photo
      
      referralSource: req.body.referralSource || '',
      additionalNotes: req.body.additionalNotes || '',
    });

    // Trigger candidate confirmation and admin alert email notifications asynchronously
    sendCandidateConfirmationEmail(application).catch(err => console.error('Error in candidate confirmation email trigger:', err));
    sendAdminNotificationEmail(application).catch(err => console.error('Error in admin notification email trigger:', err));

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: application.applicationId,
        name: application.name,
        preferredJobRole: application.preferredJobRole,
        appliedAt: application.createdAt,
      },
    });
  } catch (error) {
    // Clean up uploaded files on failure
    if (req.files) {
      const resumeFile = req.files?.['resume']?.[0];
      const photoFile = req.files?.['photo']?.[0];

      if (resumeFile) {
        const publicId = getCloudinaryPublicId(resumeFile.path);
        if (publicId) cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(e => console.error(e));
      }
      if (photoFile) {
        const publicId = getCloudinaryPublicId(photoFile.path);
        if (publicId) cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(e => console.error(e));
      }
    }
    next(error);
  }
};

// @desc    Get candidates list (Admin)
// @route   GET /api/applications
// @access  Private (Admin)
const getApplications = async (req, res, next) => {
  try {
    const query = buildFilterQuery(req.query);

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Application.countDocuments(query);
    const applications = await Application.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Map fields dynamically to maintain compatibility with list view columns
    const mappedApplications = applications.map(app => {
      const obj = app.toObject();
      obj.positionApplied = app.preferredJobRole; // Compatibility mapping
      return obj;
    });

    res.status(200).json({
      success: true,
      count: mappedApplications.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      data: mappedApplications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get application details by ID (Admin)
// @route   GET /api/applications/:id
// @access  Private (Admin)
const getApplicationById = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update application status (Admin)
// @route   PUT /api/applications/:id/status
// @access  Private (Admin)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['New', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete application (Admin)
// @route   DELETE /api/applications/:id
// @access  Private (Admin)
const deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Delete Resume file from Cloudinary
    const resumeId = getCloudinaryPublicId(application.resumeUrl);
    if (resumeId) {
      await cloudinary.uploader.destroy(resumeId, { resource_type: 'raw' }).catch((err) => {
        console.error('Error removing Cloudinary resume:', err.message);
      });
    }

    // Delete Photo file from Cloudinary (if present)
    if (application.photoUrl) {
      const photoId = getCloudinaryPublicId(application.photoUrl);
      if (photoId) {
        await cloudinary.uploader.destroy(photoId, { resource_type: 'image' }).catch((err) => {
          console.error('Error removing Cloudinary photo:', err.message);
        });
      }
    }

    await application.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Application and associated documents deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add Note to Application (Admin)
// @route   POST /api/applications/:id/notes
// @access  Private (Admin)
const addHRNote = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Note content cannot be empty',
      });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const newNote = {
      content,
      author: req.user.username || 'Admin',
    };

    application.hrNotes.push(newNote);
    await application.save();

    res.status(201).json({
      success: true,
      message: 'HR note added',
      data: application.hrNotes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit HR Note in Application (Admin)
// @route   PUT /api/applications/:id/notes/:noteId
// @access  Private (Admin)
const editHRNote = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Note content cannot be empty',
      });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const note = application.hrNotes.id(req.params.noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'HR Note not found',
      });
    }

    note.content = content;
    await application.save();

    res.status(200).json({
      success: true,
      message: 'HR note updated',
      data: application.hrNotes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete HR Note from Application (Admin)
// @route   DELETE /api/applications/:id/notes/:noteId
// @access  Private (Admin)
const deleteHRNote = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const note = application.hrNotes.id(req.params.noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'HR Note not found',
      });
    }

    application.hrNotes.pull(req.params.noteId);
    await application.save();

    res.status(200).json({
      success: true,
      message: 'HR note deleted',
      data: application.hrNotes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export applications to Excel or CSV (Admin)
// @route   GET /api/applications/export
// @access  Private (Admin)
const exportApplications = async (req, res, next) => {
  try {
    const query = buildFilterQuery(req.query);
    const applications = await Application.find(query).sort({ createdAt: -1 });

    const formattedData = applications.map((app) => ({
      'Application ID': app.applicationId || 'N/A',
      'Candidate Name': app.name,
      'Mobile Number': app.mobile,
      'WhatsApp Number': app.whatsappNumber,
      'Email Address': app.email,
      'Date of Birth': app.dob.toISOString().split('T')[0],
      'Gender': app.gender,
      'Current Location': app.currentLocation,
      'Highest Qualification': app.qualification,
      'Degree / Course Name': app.degreeCourse,
      'College / Institution Name': app.college,
      'Passing Year': app.passingYear,
      'CGPA / Percentage': app.percentage,
      'Preferred Job Role': app.preferredJobRole,
      'Preferred Location': app.preferredLocation,
      'Expected Salary': app.expectedSalary,
      'Willing to Relocate': app.willingToRelocate,
      'Preferred Shift': app.preferredShift,
      'Experience Status': app.experienceType,
      'Total Years of Experience': app.yearsOfExperience,
      'Current Company': app.currentCompany || 'N/A',
      'Current Job Role': app.currentJobRole || 'N/A',
      'Current Salary': app.currentSalary || 'N/A',
      'Notice Period': app.noticePeriod,
      'Technical Skills': app.technicalSkills.join(', '),
      'Soft Skills': app.softSkills.join(', '),
      'Languages Known': app.languagesKnown.join(', '),
      'Resume URL': app.resumeUrl,
      'Photo URL': app.photoUrl || 'N/A',
      'Referral Source': app.referralSource || 'N/A',
      'Additional Notes': app.additionalNotes || 'N/A',
      'Status': app.status,
      'Applied Date': app.createdAt.toISOString().split('T')[0],
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

    const fileFormat = req.query.format === 'csv' ? 'csv' : 'xlsx';

    if (fileFormat === 'csv') {
      const csvContent = XLSX.utils.sheet_to_csv(worksheet);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=applications_export.csv');
      return res.status(200).send(csvContent);
    } else {
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename=applications_export.xlsx');
      return res.status(200).send(excelBuffer);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  addHRNote,
  editHRNote,
  deleteHRNote,
  exportApplications,
};
