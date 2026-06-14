const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/recruitment_management_system';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for seeding...');
  } catch (err) {
    console.error('Database connection failed for seeder:', err.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // 1. Seed Admin User
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: 'admin123', // Hashed automatically
        role: 'admin',
      });
      console.log('Seeded Admin account successfully. (User: admin, Pass: admin123)');
    } else {
      console.log('Admin account already exists.');
    }

    // 2. Seed Jobs
    const jobCount = await Job.countDocuments({});
    const jobsList = [];
    if (jobCount === 0) {
      const mockJobs = [
        {
          title: 'Senior Full Stack Engineer',
          department: 'Engineering',
          description: 'Responsible for building robust backend services in Node.js and interactive client side visualisers using React.js and Tailwind CSS.',
          experienceRequired: '3-6 Years',
          salaryRange: '12 - 18 LPA',
          status: 'active',
        },
        {
          title: 'Associate Product Designer',
          department: 'Design',
          description: 'Focuses on building clean user experience flows, corporate design mockups, and mobile responsive interactive prototypes.',
          experienceRequired: '1-3 Years',
          salaryRange: '8 - 12 LPA',
          status: 'active',
        },
        {
          title: 'HR Executive',
          department: 'Human Resources',
          description: 'Manages recruitment pipelines, interview calendars, HR note commentary logging, and onboarding tasks.',
          experienceRequired: '0-2 Years',
          salaryRange: '5 - 7 LPA',
          status: 'active',
        },
      ];

      const insertedJobs = await Job.insertMany(mockJobs);
      jobsList.push(...insertedJobs);
      console.log('Seeded mock Job postings.');
    } else {
      const existingJobs = await Job.find({});
      jobsList.push(...existingJobs);
      console.log('Job entries already present.');
    }

    // 3. Clear existing applications to prevent schema mismatch errors during seeding
    await Application.deleteMany({});
    console.log('Cleaned old applications to align with new schema...');

    const generateDate = (monthsAgo) => {
      const d = new Date();
      d.setMonth(d.getMonth() - monthsAgo);
      return d;
    };

    // Seed Candidates
    const mockApplications = [
      {
        name: 'Rajesh Kumar',
        mobile: '9876543210',
        whatsappNumber: '9876543210',
        email: 'rajesh.kumar@example.com',
        dob: new Date('1996-05-15'),
        gender: 'Male',
        currentLocation: 'Noida, Uttar Pradesh',
        qualification: 'UG',
        degreeCourse: 'B.Tech Computer Science',
        college: 'IIT Delhi',
        passingYear: 2018,
        percentage: '8.2 CGPA',
        preferredJobRole: 'Senior Full Stack Engineer',
        preferredLocation: 'Noida',
        expectedSalary: '15 LPA',
        willingToRelocate: 'Yes',
        preferredShift: 'Rotational',
        experienceType: 'Experienced',
        yearsOfExperience: 5,
        currentCompany: 'InfoSys Ltd',
        currentJobRole: 'Full Stack Developer',
        currentSalary: '9 LPA',
        noticePeriod: '1 Month',
        technicalSkills: ['React', 'Node.js', 'Express', 'MongoDB'],
        softSkills: ['Problem Solving', 'Teamwork'],
        languagesKnown: ['English', 'Hindi'],
        resumeUrl: 'https://res.cloudinary.com/demo/image/upload/v1570975826/raw/upload/sample.pdf',
        photoUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
        referralSource: 'Referral',
        additionalNotes: 'Strong candidate for full-stack tasks.',
        status: 'Shortlisted',
        hrNotes: [
          { content: 'Strong coding performance. Handled architecture questions well.', author: 'admin' },
        ],
        createdAt: generateDate(4),
      },
      {
        name: 'Priya Sharma',
        mobile: '9988776655',
        whatsappNumber: '9988776655',
        email: 'priya.sharma@example.com',
        dob: new Date('1999-09-22'),
        gender: 'Female',
        currentLocation: 'Pune, Maharashtra',
        qualification: 'PG',
        degreeCourse: 'M.Des Interaction Design',
        college: 'NID Ahmedabad',
        passingYear: 2021,
        percentage: '8.8 CGPA',
        preferredJobRole: 'Associate Product Designer',
        preferredLocation: 'Pune',
        expectedSalary: '10 LPA',
        willingToRelocate: 'No',
        preferredShift: 'Day',
        experienceType: 'Experienced',
        yearsOfExperience: 3,
        currentCompany: 'Pixel Studios',
        currentJobRole: 'UI Designer',
        currentSalary: '6.5 LPA',
        noticePeriod: 'Immediate',
        technicalSkills: ['Figma', 'Prototyping', 'Adobe Suite'],
        softSkills: ['Creativity', 'Communication'],
        languagesKnown: ['English', 'Hindi', 'Marathi'],
        resumeUrl: 'https://res.cloudinary.com/demo/image/upload/v1570975826/raw/upload/sample.pdf',
        photoUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
        referralSource: 'Instagram',
        additionalNotes: 'Amazing design portfolio.',
        status: 'Selected',
        hrNotes: [
          { content: 'Outstanding portfolio. Creative and responsive layouts.', author: 'admin' },
        ],
        createdAt: generateDate(2),
      },
      {
        name: 'Amit Patel',
        mobile: '7766554433',
        whatsappNumber: '7766554433',
        email: 'amit.patel@example.com',
        dob: new Date('2001-02-10'),
        gender: 'Male',
        currentLocation: 'Kolkata, West Bengal',
        qualification: 'UG',
        degreeCourse: 'BBA Human Resources',
        college: 'Amity University',
        passingYear: 2023,
        percentage: '78%',
        preferredJobRole: 'HR Executive',
        preferredLocation: 'Kolkata',
        expectedSalary: '5.5 LPA',
        willingToRelocate: 'Yes',
        preferredShift: 'Day',
        experienceType: 'Fresher',
        yearsOfExperience: 0,
        currentCompany: '',
        currentJobRole: '',
        currentSalary: '',
        noticePeriod: 'Immediate',
        technicalSkills: ['MS Excel', 'MS Word', 'Sourcing'],
        softSkills: ['Public Speaking', 'Active Listening'],
        languagesKnown: ['English', 'Hindi', 'Bengali'],
        resumeUrl: 'https://res.cloudinary.com/demo/image/upload/v1570975826/raw/upload/sample.pdf',
        photoUrl: '',
        referralSource: 'LinkedIn',
        additionalNotes: 'Enthusiastic fresher candidate.',
        status: 'New',
        hrNotes: [],
        createdAt: generateDate(0),
      },
    ];

    await Application.insertMany(mockApplications);
    console.log('Seeded candidate applications with the restructured fields schema.');
    console.log('Database seeding completed successfully.');
    mongoose.connection.close();
  } catch (err) {
    console.error('Seeding error:', err.message);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedData();
