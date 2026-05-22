const logger = require('../utils/logger');
const { sendEmail } = require('../config/mail');

const sendVerificationEmail = async (email, name, token) => {
  try {
    const subject = 'Verify your ColdFlyer account';
    const html = `
      <h1>Welcome to ColdFlyer, ${name}!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${process.env.FRONTEND_URL}/verify-email/${token}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>Or copy this link: ${process.env.FRONTEND_URL}/verify-email/${token}</p>
      <p>This link expires in 24 hours.</p>
    `;
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err }, 'sendVerificationEmail failed');
    return false;
  }
};

const sendPasswordResetEmail = async (email, name, token) => {
  try {
    const subject = 'Reset your ColdFlyer password';
    const html = `
      <h1>Hello ${name},</h1>
      <p>You requested to reset your password. Click the link below:</p>
      <a href="${process.env.FRONTEND_URL}/reset-password/${token}" style="padding: 10px 20px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>Or copy this link: ${process.env.FRONTEND_URL}/reset-password/${token}</p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err }, 'sendPasswordResetEmail failed');
    return false;
  }
};

const sendOrderConfirmationEmail = async (email, name, order) => {
  try {
    const subject = `Order Confirmation - ${order.orderNumber}`;
    const html = `
      <h1>Thank you for your order, ${name}!</h1>
      <p>Order Number: <strong>${order.orderNumber}</strong></p>
      <p>Total: <strong>$${order.total.toFixed(2)}</strong></p>
      <p>Status: ${order.status}</p>
      <p>We'll notify you when your order ships.</p>
    `;
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err }, 'sendOrderConfirmationEmail failed');
    return false;
  }
};

const sendBookingConfirmationEmail = async (email, name, booking, status = 'confirmed') => {
  try {
    const subjects = {
      confirmed: `Service Booking Confirmed - ${booking.bookingNumber}`,
      scheduled: `Service Scheduled - ${booking.bookingNumber}`,
      completed: `Service Completed - ${booking.bookingNumber}`,
      cancelled: `Service Cancelled - ${booking.bookingNumber}`,
    };
    const messages = {
      confirmed: 'has been confirmed',
      scheduled: 'has been scheduled',
      completed: 'has been completed',
      cancelled: 'has been cancelled',
    };
    const subject = subjects[status] || subjects.confirmed;
    const html = `
      <h1>Service Booking ${messages[status] || 'updated'}, ${name}!</h1>
      <p>Booking Number: <strong>${booking.bookingNumber}</strong></p>
      <p>Service: ${booking.service?.name || 'Service'}</p>
      ${booking.scheduledDate ? `<p>Scheduled Date: ${new Date(booking.scheduledDate).toDateString()}</p>` : ''}
      <p>Thank you for choosing ColdFlyer.</p>
    `;
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err }, 'sendBookingConfirmationEmail failed');
    return false;
  }
};

const sendVerificationCode = async (email, name, code) => {
  try {
    const subject = 'Your ColdFlyer email verification code';
    const html = `
      <h1>Email Verification</h1>
      <p>Hello ${name},</p>
      <p>Use the code below to verify your email address:</p>
      <div style="font-size: 32px; letter-spacing: 8px; font-weight: bold; text-align: center; padding: 20px; background: #f4f4f4; border-radius: 8px; margin: 20px 0;">${code}</div>
      <p>This code expires in 15 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err }, 'sendVerificationCode failed');
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendBookingConfirmationEmail,
  sendVerificationCode,
};