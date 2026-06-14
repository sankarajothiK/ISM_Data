const { body, validationResult } = require('express-validator');

// Error checker that checks validation results and returns errors if present
const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// Application form validation rules matching new fields
const applicationValidationRules = [
  // Personal Info
  body('name').trim().notEmpty().withMessage('Full Name is required'),
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Mobile number must be a valid 10-digit Indian mobile number'),
  body('whatsappNumber')
    .trim()
    .notEmpty()
    .withMessage('WhatsApp number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('WhatsApp number must be a valid 10-digit number'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Must be a valid email address'),
  body('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  body('dob')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  body('currentLocation').trim().notEmpty().withMessage('Current Location (City / District) is required'),
  
  // Educational Details
  body('qualification')
    .notEmpty()
    .withMessage('Highest qualification is required')
    .isIn(['10th', '12th', 'Diploma', 'UG', 'PG', 'Others'])
    .withMessage('Highest qualification must be 10th, 12th, Diploma, UG, PG, or Others'),
  body('degreeCourse').trim().notEmpty().withMessage('Degree / Course Name is required'),
  body('college').trim().notEmpty().withMessage('College / Institution Name is required'),
  body('passingYear')
    .notEmpty()
    .withMessage('Year of passing is required')
    .isInt({ min: 1980, max: 2035 })
    .withMessage('Passing year must be a valid year'),
  body('percentage').trim().notEmpty().withMessage('CGPA / Percentage is required'),

  // Job Preferences
  body('preferredJobRole').trim().notEmpty().withMessage('Preferred Job Role is required'),
  body('preferredLocation').trim().notEmpty().withMessage('Preferred Location is required'),
  body('expectedSalary').trim().notEmpty().withMessage('Expected Salary is required'),
  body('willingToRelocate')
    .notEmpty()
    .withMessage('Relocation preference is required')
    .isIn(['Yes', 'No'])
    .withMessage('Willing to relocate must be Yes or No'),
  body('preferredShift')
    .notEmpty()
    .withMessage('Preferred Shift is required')
    .isIn(['Day', 'Night', 'Rotational'])
    .withMessage('Preferred Shift must be Day, Night, or Rotational'),

  // Experience Details
  body('experienceType')
    .notEmpty()
    .withMessage('Experience status is required')
    .isIn(['Fresher', 'Experienced'])
    .withMessage('Experience status must be Fresher or Experienced'),
  body('yearsOfExperience')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 50 })
    .withMessage('Total years of experience must be between 0 and 50'),
  body('currentCompany').optional({ checkFalsy: true }).trim(),
  body('currentJobRole').optional({ checkFalsy: true }).trim(),
  body('currentSalary').optional({ checkFalsy: true }).trim(),
  body('noticePeriod').trim().notEmpty().withMessage('Notice Period is required'),
];

// Job creation validation rules
const jobValidationRules = [
  body('title').trim().notEmpty().withMessage('Job Title is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('description').trim().notEmpty().withMessage('Job Description is required'),
  body('experienceRequired').trim().notEmpty().withMessage('Experience Required is required'),
  body('salaryRange').trim().notEmpty().withMessage('Salary Range is required'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
];

module.exports = {
  applicationValidationRules,
  jobValidationRules,
  validateResults,
};
