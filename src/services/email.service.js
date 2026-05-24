const logger = require("../utils/logger");
const { sendEmail } = require("../config/mail");

const sendVerificationEmail = async (email, name, token) => {
  try {
    const subject = "Verify your ColdFlyer account";
    const html = `
      <h1>Welcome to ColdFlyer, ${name}!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${process.env.FRONTEND_URL}/verify-email/${token}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>Or copy this link: ${process.env.FRONTEND_URL}/verify-email/${token}</p>
      <p>This link expires in 24 hours.</p>
    `;
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err }, "sendVerificationEmail failed");
    return false;
  }
};

const sendPasswordResetEmail = async (email, name, token) => {
  try {
    const subject = "Reset your ColdFlyer password";
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
    logger.error({ err }, "sendPasswordResetEmail failed");
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
    logger.error({ err }, "sendOrderConfirmationEmail failed");
    return false;
  }
};

const sendBookingConfirmationEmail = async (email, name, booking, status = "confirmed") => {
  try {
    const subjects = {
      confirmed: `Service Booking Confirmed - ${booking.bookingNumber}`,
      scheduled: `Service Scheduled - ${booking.bookingNumber}`,
      completed: `Service Completed - ${booking.bookingNumber}`,
      cancelled: `Service Cancelled - ${booking.bookingNumber}`,
    };
    const messages = {
      confirmed: "has been confirmed",
      scheduled: "has been scheduled",
      completed: "has been completed",
      cancelled: "has been cancelled",
    };
    const subject = subjects[status] || subjects.confirmed;
    const html = `
      <h1>Service Booking ${messages[status] || "updated"}, ${name}!</h1>
      <p>Booking Number: <strong>${booking.bookingNumber}</strong></p>
      <p>Service: ${booking.service?.name || "Service"}</p>
      ${booking.scheduledDate ? `<p>Scheduled Date: ${new Date(booking.scheduledDate).toDateString()}</p>` : ""}
      <p>Thank you for choosing ColdFlyer.</p>
    `;
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err }, "sendBookingConfirmationEmail failed");
    return false;
  }
};

const sendVerificationCode = async (email, name, code) => {
  try {
    const subject = "Your ColdFlyer email verification code";
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
    logger.error({ err }, "sendVerificationCode failed");
    return false;
  }
};

const sendApplicationApprovedEmail = async (email, name) => {
  try {
    const subject = "Welcome to ColdFlyer — Your Application is Approved!";
    const html = `
      <h1>Congratulations, ${name}!</h1>
      <p>We are pleased to inform you that your application has been approved. You are now part of the ColdFlyer team as a technician.</p>
      <p>You can log in to your dashboard to view your profile and manage your service bookings.</p>
      <p>Visit: <a href="${process.env.FRONTEND_URL}/dashboard">${process.env.FRONTEND_URL}/dashboard</a></p>
      <p>Welcome aboard!</p>
    `;
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err }, "sendApplicationApprovedEmail failed");
    return false;
  }
};

const sendApplicationReceivedEmail = async (email, name, position) => {
  try {
    const subject = "We Received Your Application — ColdFlyer";
    const html = `
      <h1>Thank you, ${name}!</h1>
      <p>We have received your application for the position of <strong>${position}</strong>.</p>
      <p>Our recruiting team will review your application and get back to you within 48 hours.</p>
      <p>If you have any questions in the meantime, feel free to reach out to us at <a href="mailto:careers@coldflyer.com">careers@coldflyer.com</a>.</p>
      <p>Best regards,<br/>The ColdFlyer Team</p>
    `;
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err }, "sendApplicationReceivedEmail failed");
    return false;
  }
};

const sendApplicationRejectedEmail = async (email, name, reason) => {
  try {
    const subject = "Update on Your ColdFlyer Application";
    const html = `
      <h1>Dear ${name},</h1>
      <p>Thank you for your interest in joining ColdFlyer.</p>
      <p>After careful review, we regret to inform you that we are unable to move forward with your application at this time.</p>
      ${reason ? `<p><strong>Feedback:</strong> ${reason}</p>` : ""}
      <p>We encourage you to apply again in the future when new opportunities arise.</p>
      <p>Best regards,<br/>The ColdFlyer Team</p>
    `;
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err }, "sendApplicationRejectedEmail failed");
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendBookingConfirmationEmail,
  sendVerificationCode,
  sendApplicationApprovedEmail,
  sendApplicationRejectedEmail,
  sendApplicationReceivedEmail,
};
