const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Rural Classroom" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('📧 Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('❌ Email error:', err.message);
    throw err;
  }
};

const welcomeEmail = (name) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <h1 style="color:#4F46E5;">Welcome to Rural Classroom!</h1>
  <p>Hi <strong>${name}</strong>,</p>
  <p>Your account has been successfully created. You now have access to our AI-Enhanced Remote Learning Platform.</p>
  <p>Start exploring courses, joining live classes, and improving your learning journey today!</p>
  <br/>
  <p style="color:#6B7280;">The Rural Classroom Team</p>
</div>
`;

const approvalEmail = (name) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <h1 style="color:#10B981;">Account Approved!</h1>
  <p>Hi <strong>${name}</strong>,</p>
  <p>Your account has been approved by the administrator. You can now log in and access all features.</p>
  <br/>
  <p style="color:#6B7280;">The Rural Classroom Team</p>
</div>
`;

module.exports = { sendEmail, welcomeEmail, approvalEmail };
