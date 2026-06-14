const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary API credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'mock_cloud',
  api_key: process.env.CLOUDINARY_API_KEY || 'mock_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'mock_secret',
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    const cleanFileName = file.originalname
      .split('.')
      .slice(0, -1)
      .join('.')
      .replace(/[^a-zA-Z0-9]/g, '_');
    
    // Separate folder and resource types for photos vs documents
    const folder = file.fieldname === 'photo' ? 'recruitment_photos' : 'recruitment_resumes';
    const resource_type = file.fieldname === 'photo' ? 'image' : 'raw'; // raw is required for doc/docx/pdf files

    return {
      folder,
      format: fileExtension,
      resource_type,
      public_id: `${Date.now()}_${cleanFileName}`,
    };
  },
});

// Filter file types based on the input field
const fileFilter = (req, file, cb) => {
  const fileExtension = file.originalname.split('.').pop().toLowerCase();

  if (file.fieldname === 'resume') {
    const allowedDocExtensions = ['pdf', 'doc', 'docx'];
    if (allowedDocExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid resume format. Only PDF, DOC, and DOCX are allowed.'), false);
    }
  } else if (file.fieldname === 'photo') {
    const allowedPhotoExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (allowedPhotoExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid photo format. Only JPG, JPEG, PNG, and WEBP are allowed.'), false);
    }
  } else {
    cb(new Error('Unexpected file upload field.'), false);
  }
};

// Multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    // Check sizes: Resume (5MB), Photo (2MB)
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});

module.exports = {
  cloudinary,
  upload,
};
