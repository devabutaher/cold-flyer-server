const logger = require('../utils/logger');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    logger.info({ messageId: info.messageId }, 'Email sent');
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Email send error');
    return false;
  }
};

module.exports = { transporter, sendEmail };