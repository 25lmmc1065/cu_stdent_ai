const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendComplaintConfirmation = async (email, complaintId, title) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"University Complaint System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Complaint Submitted Successfully - #${complaintId.slice(0, 8).toUpperCase()}`,
      html: `
        <h2>Complaint Received</h2>
        <p>Your complaint has been submitted successfully.</p>
        <p><strong>Complaint ID:</strong> ${complaintId}</p>
        <p><strong>Title:</strong> ${title}</p>
        <p>We will review your complaint and respond as soon as possible.</p>
      `,
    });
  } catch (err) {
    console.error('Failed to send complaint confirmation email:', err.message);
  }
};

const sendStatusUpdate = async (email, complaintId, status, response) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"University Complaint System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Complaint Status Updated - #${complaintId.slice(0, 8).toUpperCase()}`,
      html: `
        <h2>Complaint Status Update</h2>
        <p>The status of your complaint has been updated.</p>
        <p><strong>Complaint ID:</strong> ${complaintId}</p>
        <p><strong>New Status:</strong> ${status}</p>
        ${response ? `<p><strong>Response:</strong> ${response}</p>` : ''}
      `,
    });
  } catch (err) {
    console.error('Failed to send status update email:', err.message);
  }
};

const sendAppealUpdate = async (email, appealId, status) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"University Complaint System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Appeal Status Updated - #${appealId.slice(0, 8).toUpperCase()}`,
      html: `
        <h2>Appeal Status Update</h2>
        <p>The status of your appeal has been updated.</p>
        <p><strong>Appeal ID:</strong> ${appealId}</p>
        <p><strong>New Status:</strong> ${status}</p>
      `,
    });
  } catch (err) {
    console.error('Failed to send appeal update email:', err.message);
  }
};

module.exports = { sendComplaintConfirmation, sendStatusUpdate, sendAppealUpdate };
