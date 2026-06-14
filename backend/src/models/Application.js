const mongoose = require('mongoose');

const hrNoteSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      default: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

const applicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Personal Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ['Male', 'Female', 'Other'],
    },
    dob: {
      type: Date,
      required: true,
    },
    currentLocation: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Educational Details
    qualification: {
      type: String,
      required: true,
      enum: ['10th', '12th', 'Diploma', 'UG', 'PG', 'Others'],
    },
    degreeCourse: {
      type: String,
      required: true,
      trim: true,
    },
    college: {
      type: String,
      required: true,
      trim: true,
    },
    passingYear: {
      type: Number,
      required: true,
    },
    percentage: {
      type: String,
      required: true,
      trim: true,
    },

    // Job Preferences
    preferredJobRole: {
      type: String,
      required: true,
      trim: true,
    },
    preferredLocation: {
      type: String,
      required: true,
      trim: true,
    },
    expectedSalary: {
      type: String,
      required: true,
      trim: true,
    },
    willingToRelocate: {
      type: String,
      required: true,
      enum: ['Yes', 'No'],
    },
    preferredShift: {
      type: String,
      required: true,
      enum: ['Day', 'Night', 'Rotational'],
    },

    // Experience Details
    experienceType: {
      type: String,
      required: true,
      enum: ['Fresher', 'Experienced'],
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
    },
    currentCompany: {
      type: String,
      trim: true,
      default: '',
    },
    currentJobRole: {
      type: String,
      trim: true,
      default: '',
    },
    currentSalary: {
      type: String,
      trim: true,
      default: '',
    },
    noticePeriod: {
      type: String,
      required: true,
      trim: true,
    },

    // Skills & Languages
    technicalSkills: {
      type: [String],
      default: [],
    },
    softSkills: {
      type: [String],
      default: [],
    },
    languagesKnown: {
      type: [String],
      default: [],
    },

    // Documents
    resumeUrl: {
      type: String,
      required: true,
    },
    photoUrl: {
      type: String,
      default: '',
    },

    // Additional Information
    referralSource: {
      type: String,
      trim: true,
      default: '',
    },
    additionalNotes: {
      type: String,
      trim: true,
      default: '',
    },

    // Status
    status: {
      type: String,
      enum: ['New', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'],
      default: 'New',
    },
    hrNotes: [hrNoteSchema],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate Unique Application ID if not provided
applicationSchema.pre('save', async function (next) {
  if (!this.applicationId) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    this.applicationId = `APP-${dateStr}-${randomDigits}`;
  }
  next();
});

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;
