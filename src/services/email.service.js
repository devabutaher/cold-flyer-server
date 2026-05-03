const { sendEmail } = require('../config/mail');

const sendVerificationEmail = async (email, name, token) => {
  const subject = 'Verify your ColdFlyer account';
  const html = `
    <h1>Welcome to ColdFlyer, ${name}!</h1>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="${process.env.FRONTEND_URL}/verify-email/${token}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
    <p>Or copy this link: ${process.env.FRONTEND_URL}/verify-email/${token}</p>
    <p>This link expires in 24 hours.</p>
  `;
  return sendEmail(email, subject, html);
};

const sendPasswordResetEmail = async (email, name, token) => {
  const subject = 'Reset your ColdFlyer password';
  const html = `
    <h1>Hello ${name},</h1>
    <p>You requested to reset your password. Click the link below:</p>
    <a href="${process.env.FRONTEND_URL}/reset-password/${token}" style="padding: 10px 20px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <p>Or copy this link: ${process.env.FRONTEND_URL}/reset-password/${token}</p>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  return sendEmail(email, subject, html);
};

const sendOrderConfirmationEmail = async (email, name, order) => {
  const subject = `Order Confirmation - ${order.orderNumber}`;
  const html = `
    <h1>Thank you for your order, ${name}!</h1>
    <p>Order Number: <strong>${order.orderNumber}</strong></p>
    <p>Total: <strong>$${order.total.toFixed(2)}</strong></p>
    <p>Status: ${order.status}</p>
    <p>We'll notify you when your order ships.</p>
  `;
  return sendEmail(email, subject, html);
};

const sendBookingConfirmationEmail = async (email, name, booking) => {
  const subject = `Service Booking Confirmed - ${booking.bookingNumber}`;
  const html = `
    <h1>Service Booking Confirmed, ${name}!</h1>
    <p>Booking Number: <strong>${booking.bookingNumber}</strong></p>
    <p>Service: ${booking.service?.name}</p>
    <p>Scheduled Date: ${booking.scheduledDate ? new Date(booking.scheduledDate).toDateString() : 'To be scheduled'}</p>
    <p>We'll send you a confirmation with the technician details.</p>
  `;
  return sendEmail(email, subject, html);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendBookingConfirmationEmail,
};