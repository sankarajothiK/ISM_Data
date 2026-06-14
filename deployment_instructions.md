# Deployment & Setup Instructions

## ISM Data Technology Recruitment Management System

This document provides step-by-step instructions for configuring, seeding, testing, and deploying the complete recruitment management system.

---

## 1. Project Directory Structure

```
recruitment-management-system/
├── backend/                  # Node.js + Express.js Server
│   ├── src/
│   │   ├── config/           # DB & Cloudinary configs, seeders
│   │   ├── controllers/      # Route controllers (auth, applications, dashboard)
│   │   ├── middleware/       # Auth validation & security handlers
│   │   ├── models/           # Mongoose schemas (User, Job, Application)
│   │   ├── routes/           # Express routes
│   │   ├── utils/            # Email alerts (Nodemailer service)
│   │   └── server.js         # Entry point
│   ├── .env.example
│   ├── .env                  # Private configurations
│   └── package.json
└── frontend/                 # React.js + Vite Client (Tailwind CSS)
    ├── src/
    │   ├── components/       # Unified branding/logo component
    │   ├── pages/            # Core views (Apply, Dashboard, QRCode, Details)
    │   ├── services/         # API hooks (Axios connector)
    │   ├── App.jsx           # Main routing
    │   └── main.jsx
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js        # Proxy and Rollup configurations
    └── package.json
```

---

## 2. Local Setup & Seeding

### Prerequisites
- Install **Node.js** (version >= 16.0.0)
- Install **MongoDB** (locally or get a MongoDB Atlas cluster URI)
- Create a free **Cloudinary** account for secure resume document storage.

### A. Backend Configuration
1. Open the `/backend` directory.
2. Edit the `.env` file with your credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

   # MongoDB connection
   MONGO_URI=mongodb://localhost:27017/recruitment_management_system # Or Atlas URI

   # JWT Auth
   JWT_SECRET=ism_data_technology_recruitment_secret_2026_jwt_token_key

   # Cloudinary Storage
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # SMTP Email Configuration (Nodemailer)
   # (Leave as smtp.mailtrap.io / empty to mock-log emails to the console)
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   SMTP_FROM=careers@ismdatatechnology.com
   ADMIN_NOTIFICATION_EMAIL=admin@ismdatatechnology.com
   ```

### B. Seed the Database
Ensure your MongoDB instance is running, and then seed the default admin credentials and mock jobs:
```bash
cd backend
npm run dev # To make sure dependencies are loaded
node src/config/seed.js
```
*Successfully seeded!* The default admin login is:
- **Username**: `admin`
- **Password**: `admin123`

### C. Run Servers Locally
Start the backend development server (will run on port 5000):
```bash
cd backend
npm run dev
```

Start the frontend development server (will run on port 5173):
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

---

## 3. Production Deployment

### A. Database (MongoDB Atlas)
1. Sign up on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free cluster and select **AWS/GCP** as provider.
3. Under **Database Access**, create a user with read/write privileges.
4. Under **Network Access**, whitelist `0.0.0.0/g` (required for serverless platform connections).
5. Copy the connection string (format: `mongodb+srv://...`) and keep it for your backend environment configuration.

### B. Backend Deployment (Railway)
1. Register/Login on [Railway.app](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your repository and configure the Root Directory as `backend`.
4. Navigate to the **Variables** tab on Railway, and add all values from your `.env` file:
   - `PORT=5000`
   - `NODE_ENV=production`
   - `ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app` (Add Vercel URL here after deploying frontend)
   - `MONGO_URI` (Your Atlas cluster URI)
   - `JWT_SECRET` (A strong random string)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `ADMIN_NOTIFICATION_EMAIL`
5. Railway will deploy the application automatically. Copy the provided backend deployment URL.

### C. Frontend Deployment (Vercel)
1. Register/Login on [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project** -> Select your GitHub repository.
3. In **Configure Project**:
   - Set **Framework Preset** to `Vite`.
   - Set **Root Directory** to `frontend`.
4. Open the **Environment Variables** section and add:
   - `VITE_API_URL` = `https://your-backend-railway-url.railway.app/api` (The URL provided by Railway)
5. Click **Deploy**. Vercel will build and deploy your React frontend.

---

## 4. Features Verification Checklist
1. **Permanent QR Code**: Visit `/admin/qrcode` in the dashboard, scan it to test candidate redirection, and test downloading the QR code in **PNG**, **JPG**, **SVG**, and **PDF** formats.
2. **Apply Form**: Go to `/apply` and complete the 5-step wizard. Upload a dummy PDF resume.
3. **Email Logs**: In development mode, check your backend console logs for printed HTML templates of candidate confirmation and admin alerts.
4. **Excel Export**: In `/admin/applications`, click "Export XLSX" to download the candidate worksheet containing all 30 fields.
5. **Dossier PDF**: Click on any candidate record -> click "Download Profile PDF" to generate the branded PDF dossier.
