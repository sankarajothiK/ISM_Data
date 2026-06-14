const nodemailer = require('nodemailer');

// Helper to create transport
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // If credentials are placeholder or missing, return a dummy mock logger transporter
  if (!host || !user || user === 'your_smtp_user' || host.includes('example.com')) {
    console.log('[EmailService] SMTP credentials missing/default. Using console logging fallback.');
    return {
      sendMail: async (mailOptions) => {
        console.log('\n================== MOCK EMAIL SENT ==================');
        console.log(`From:    ${mailOptions.from}`);
        console.log(`To:      ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log('------------------ HTML BODY ------------------');
        console.log(mailOptions.html);
        console.log('=====================================================\n');
        return { messageId: `mock-id-${Date.now()}` };
      }
    };
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465, // True for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
};

const transporter = createTransporter();

// Corporate styling wrapper template
const getEmailWrapperHTML = (contentHTML) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
            border: 1px solid #e2e8f0;
          }
          .email-header {
            background-color: #0f172a;
            color: #ffffff;
            padding: 30px;
            text-align: center;
            border-bottom: 4px solid #4f46e5;
          }
          .logo-text {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 1px;
            margin: 0;
            color: #ffffff;
          }
          .logo-subtext {
            font-size: 11px;
            color: #818cf8;
            margin: 5px 0 0 0;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 2px;
          }
          .email-body {
            padding: 40px 30px;
            color: #334155;
            line-height: 1.6;
            font-size: 15px;
          }
          .email-footer {
            background-color: #f8fafc;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 12px;
          }
          .btn-primary {
            display: inline-block;
            padding: 12px 24px;
            background-color: #4f46e5;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 700;
            margin-top: 15px;
            box-shadow: 0 4px 6px rgba(79, 70, 229, 0.15);
          }
          .table-details {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
          }
          .table-details th, .table-details td {
            text-align: left;
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .table-details th {
            color: #64748b;
            font-weight: 600;
            font-size: 13px;
            width: 35%;
          }
          .table-details td {
            color: #0f172a;
            font-weight: 700;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1 class="logo-text">ISM DATA</h1>
            <p class="logo-subtext">Empowering Rural Women's</p>
          </div>
          <div class="email-body">
            ${contentHTML}
          </div>
          <div class="email-footer">
            <p>&copy; ${new Date().getFullYear()} ISM Data Technology. All Rights Reserved.</p>
            <p>Tech Park, City Centre, India | careers@ismdatatechnology.com</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Send candidate confirmation email
 * @param {Object} application Candidate application object
 */
const sendCandidateConfirmationEmail = async (application) => {
  const fromEmail = process.env.SMTP_FROM || 'careers@ismdatatechnology.com';
  
  const contentHTML = `
    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Application Received</h2>
    <p>Dear <strong>${application.name}</strong>,</p>
    <p>Thank you for submitting your job application to ISM Data Technology. We have successfully received your profile details for the position of <strong>${application.preferredJobRole}</strong>.</p>
    
    <table class="table-details">
      <tr>
        <th>Application ID</th>
        <td>${application.applicationId}</td>
      </tr>
      <tr>
        <th>Position Applied</th>
        <td>${application.preferredJobRole}</td>
      </tr>
      <tr>
        <th>Submission Date</th>
        <td>${new Date(application.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
      </tr>
    </table>

    <p>Our human resources department will review your skills and credentials. If your profile is shortlisted, our hiring managers will contact you for the next steps in our interview process.</p>
    
    <p>Best Regards,<br><strong>Recruitment Team</strong><br>ISM Data Technology</p>
  `;

  const mailOptions = {
    from: `"ISM Data Technology Careers" <${fromEmail}>`,
    to: application.email,
    subject: 'Application Received - ISM Data Technology',
    html: getEmailWrapperHTML(contentHTML),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Confirmation email sent to ${application.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EmailService] Failed to send confirmation email to ${application.email}:`, error.message);
  }
};

/**
 * Send new application alert to HR Admins
 * @param {Object} application Candidate application object
 */
const sendAdminNotificationEmail = async (application) => {
  const fromEmail = process.env.SMTP_FROM || 'careers@ismdatatechnology.com';
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@ismdatatechnology.com';
  
  const contentHTML = `
    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">New Job Application Received</h2>
    <p>Hi HR Manager,</p>
    <p>A new candidate profile has been submitted through the job application portal.</p>
    
    <h3 style="color: #0f172a; margin-bottom: 5px; font-size: 16px; border-bottom: 2px dashed #e2e8f0; padding-bottom: 5px;">Candidate Information Summary</h3>
    <table class="table-details">
      <tr>
        <th>Application ID</th>
        <td style="color: #4f46e5; font-family: monospace;">${application.applicationId}</td>
      </tr>
      <tr>
        <th>Candidate Name</th>
        <td>${application.name}</td>
      </tr>
      <tr>
        <th>Job Position</th>
        <td>${application.preferredJobRole}</td>
      </tr>
      <tr>
        <th>Mobile / WhatsApp</th>
        <td>${application.mobile} / ${application.whatsappNumber}</td>
      </tr>
      <tr>
        <th>Highest Qualification</th>
        <td>${application.qualification} (${application.degreeCourse})</td>
      </tr>
      <tr>
        <th>Experience Status</th>
        <td>${application.experienceType} ${application.experienceType === 'Experienced' ? `(${application.yearsOfExperience} Years)` : ''}</td>
      </tr>
      <tr>
        <th>Preferred Shift</th>
        <td>${application.preferredShift} Shift</td>
      </tr>
      <tr>
        <th>Notice Period</th>
        <td>${application.noticePeriod}</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 30px 0 10px 0;">
      <a href="${application.resumeUrl}" class="btn-primary" target="_blank" rel="noreferrer">Open Candidate Resume</a>
    </div>

    <p style="margin-top: 25px;">You can view and manage this applicant by logging into the Admin Recruitment Dashboard portal.</p>
  `;

  const mailOptions = {
    from: `"RMS Notification" <${fromEmail}>`,
    to: adminEmail,
    subject: `New Job Application: ${application.name} - ${application.preferredJobRole}`,
    html: getEmailWrapperHTML(contentHTML),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Admin notification email sent to ${adminEmail}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EmailService] Failed to send admin notification email to ${adminEmail}:`, error.message);
  }
};

module.exports = {
  sendCandidateConfirmationEmail,
  sendAdminNotificationEmail,
};
