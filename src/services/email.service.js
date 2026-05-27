const logger = require("../utils/logger");
const { sendEmail } = require("../config/mail");
const {
  buildStandardEmail,
  buildStatusBadge,
  buildOrderTable,
  buildServiceTable,
  buildSummaryLine,
  buildVerificationCode,
  formatCurrency,
  formatDate,
  formatDateTime,
  COLORS,
  BRAND_NAME,
  FRONTEND_URL,
} = require("./email-templates");

// ── Helpers ──────────────────────────────────────────────────────────────────

const getSuperAdminEmail = () => process.env.ADMIN_EMAIL || null;

/**
 * Safely get user name from a user object or booking guest fields.
 */
const getRecipientName = (user, fallback) => {
  if (user && user.name) return user.name;
  if (fallback) return fallback;
  return "Valued Customer";
};

/**
 * Safely get email from user or guest booking.
 */
const getRecipientEmail = (user, bookingOrOrder) => {
  if (user && user.email) return user.email;
  if (bookingOrOrder && bookingOrOrder.customerEmail) return bookingOrOrder.customerEmail;
  return null;
};

// ── Auth & Security Emails ────────────────────────────────────────────────────

const sendVerificationEmail = async (email, name, token) => {
  try {
    const subject = `Verify your ${BRAND_NAME} account`;
    const verifyUrl = `${FRONTEND_URL}/verify-email/${token}`;
    const html = buildStandardEmail({
      name,
      previewText: `Welcome to ${BRAND_NAME}! Please verify your email address.`,
      content: `
        <p style="margin: 0 0 12px; font-size: 15px;">Thank you for creating an account with ${BRAND_NAME}!</p>
        <p style="margin: 0 0 12px; font-size: 15px;">Please verify your email address by clicking the button below:</p>
      `,
      buttonUrl: verifyUrl,
      buttonText: "Verify Email Address",
      additionalFooter: `This link expires in 24 hours. If you did not create an account, please ignore this email.`,
    });
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err }, "sendVerificationEmail failed");
    return false;
  }
};

const sendPasswordResetEmail = async (email, name, token) => {
  try {
    const subject = `Reset your ${BRAND_NAME} password`;
    const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;
    const html = buildStandardEmail({
      name,
      previewText: "You requested a password reset link.",
      content: `
        <p style="margin: 0 0 12px; font-size: 15px;">We received a request to reset your ${BRAND_NAME} account password.</p>
        <p style="margin: 0 0 12px; font-size: 15px;">Click the button below to set a new password:</p>
      `,
      buttonUrl: resetUrl,
      buttonText: "Reset Password",
      additionalFooter: `This link expires in 1 hour. If you didn't request this, please ignore this email.`,
    });
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err }, "sendPasswordResetEmail failed");
    return false;
  }
};

const sendVerificationCode = async (email, name, code) => {
  try {
    const subject = `Your ${BRAND_NAME} email verification code`;
    const html = buildStandardEmail({
      name,
      previewText: `Your verification code is: ${code}`,
      content: `
        <p style="margin: 0 0 12px; font-size: 15px;">Use the verification code below to verify your email address:</p>
        ${buildVerificationCode(code)}
        <p style="margin: 0; font-size: 14px; color: #6B7280;">This code expires in 15 minutes. If you didn't request this, please ignore this email.</p>
      `,
    });
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err }, "sendVerificationCode failed");
    return false;
  }
};

// ── Order Emails ─────────────────────────────────────────────────────────────

const sendOrderConfirmationEmail = async (email, name, order) => {
  try {
    const subject = `Order Confirmed - ${order.orderNumber}`;
    const orderUrl = `${FRONTEND_URL}/order/${order._id}`;

    const items = order.items || [];
    const itemRows = buildOrderTable(items, { showImage: true });

    let summaryRows = buildSummaryLine("Subtotal", formatCurrency(order.subtotal || 0));
    if (order.discount > 0) {
      summaryRows += buildSummaryLine("Discount", `-${formatCurrency(order.discount)}`);
    }
    if (order.shippingCost > 0) {
      summaryRows += buildSummaryLine("Shipping", formatCurrency(order.shippingCost));
    }
    if (order.tax > 0) {
      summaryRows += buildSummaryLine("Tax", formatCurrency(order.tax));
    }
    summaryRows += buildSummaryLine("Total", formatCurrency(order.total), { bold: true, large: true, borderTop: true });

    const html = buildStandardEmail({
      name,
      previewText: `Your order ${order.orderNumber} has been confirmed! Total: ${formatCurrency(order.total)}`,
      content: `
        <p style="margin: 0 0 8px; font-size: 15px;">Thank you for your order! Your order has been placed successfully.</p>
        <div style="margin: 16px 0; padding: 12px 16px; background: #FEF3C7; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #92400E;">Order #${order.orderNumber}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #92400E;">Placed on ${formatDateTime(order.createdAt)}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #92400E;">Status: ${buildStatusBadge(order.status)}</p>
        </div>
        ${itemRows}
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; margin-top: 8px;">
          ${summaryRows}
        </table>
      `,
      buttonUrl: orderUrl,
      buttonText: "View Order Details",
      additionalFooter: `We'll notify you when your order ships. If you have any questions, contact our support team.`,
    });
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err, orderId: order._id }, "sendOrderConfirmationEmail failed");
    return false;
  }
};

const sendOrderStatusUpdateEmail = async (email, name, order, previousStatus) => {
  try {
    const subject = `Order ${order.status.charAt(0).toUpperCase() + order.status.slice(1)} - ${order.orderNumber}`;
    const orderUrl = `${FRONTEND_URL}/order/${order._id}`;

    const statusMessages = {
      confirmed: "Your order has been confirmed and is being prepared.",
      processing: "Your order is now being processed.",
      shipped: "Your order has been shipped and is on its way!",
      out_for_delivery: "Your order is out for delivery today.",
      delivered: "Your order has been delivered successfully!",
      cancelled: "Your order has been cancelled.",
      refunded: "Your order has been refunded.",
    };

    const message = statusMessages[order.status] || `Your order status has been updated to ${order.status}.`;

    const html = buildStandardEmail({
      name,
      previewText: `Your order ${order.orderNumber} is now ${order.status}.`,
      content: `
        <div style="margin: 16px 0; padding: 16px; background: #F9FAFB; border-radius: 8px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: ${COLORS.foreground};">Order Status Update</p>
          ${buildStatusBadge(order.status)}
        </div>
        <p style="margin: 0 0 12px; font-size: 15px;">${message}</p>
        <div style="margin: 16px 0; padding: 12px 16px; background: #FEF3C7; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #92400E;">Order #${order.orderNumber}</p>
          ${previousStatus ? `<p style="margin: 4px 0 0; font-size: 13px; color: #92400E;">Previous status: ${buildStatusBadge(previousStatus)}</p>` : ""}
          <p style="margin: 4px 0 0; font-size: 13px; color: #92400E;">Total: ${formatCurrency(order.total)}</p>
        </div>
      `,
      buttonUrl: orderUrl,
      buttonText: "View Order",
      additionalFooter: `If you have any questions, please contact our support team.`,
    });
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err, orderId: order._id }, "sendOrderStatusUpdateEmail failed");
    return false;
  }
};

// ── Booking Emails ───────────────────────────────────────────────────────────

const sendBookingConfirmationEmail = async (email, name, booking, status = "confirmed") => {
  try {
    const statusLabels = {
      confirmed: "Confirmed",
      scheduled: "Scheduled",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    const subject = `Service Booking ${statusLabels[status] || "Updated"} - ${booking.bookingNumber}`;
    const bookingUrl = `${FRONTEND_URL}/dashboard/bookings/${booking._id}`;

    const statusMessages = {
      confirmed:
        "Your service booking has been confirmed. Our team will contact you shortly to schedule a convenient time.",
      scheduled: "Your service has been scheduled. A technician will visit you at the scheduled time.",
      completed: "Your service has been completed. Thank you for choosing Cold Flyer!",
      cancelled: "Your service booking has been cancelled.",
    };

    const message = statusMessages[status] || `Your booking status has been updated to ${status}.`;

    const items = booking.items || [];
    const itemTable = items.length > 0 ? buildServiceTable(items) : "";

    let serviceDetails = "";
    if (booking.service) {
      const serviceName = booking.service.name || booking.service;
      serviceDetails = `<p style="margin: 0 0 4px; font-size: 14px;"><strong>Service:</strong> ${serviceName}</p>`;
    }
    if (booking.scheduledDate) {
      serviceDetails += `<p style="margin: 0 0 4px; font-size: 14px;"><strong>Scheduled:</strong> ${formatDate(booking.scheduledDate)}${booking.scheduledTime?.start ? ` at ${booking.scheduledTime.start}` : ""}</p>`;
    }
    if (booking.acBrand || booking.acType) {
      serviceDetails += `<p style="margin: 0; font-size: 14px;"><strong>AC Details:</strong> ${[booking.acBrand, booking.acModel, booking.acTon, booking.acType].filter(Boolean).join(" | ")}</p>`;
    }

    const html = buildStandardEmail({
      name,
      previewText: `Your service booking ${booking.bookingNumber} is ${statusLabels[status] || status}.`,
      content: `
        <div style="margin: 16px 0; padding: 16px; background: #F9FAFB; border-radius: 8px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: ${COLORS.foreground};">Service ${statusLabels[status] || "Update"}</p>
          ${buildStatusBadge(status)}
        </div>
        <p style="margin: 0 0 12px; font-size: 15px;">${message}</p>
        <div style="margin: 16px 0; padding: 12px 16px; background: #FEF3C7; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #92400E;">Booking #${booking.bookingNumber}</p>
          ${serviceDetails}
          <p style="margin: 4px 0 0; font-size: 13px; color: #92400E;">Total: ${formatCurrency(booking.total)}</p>
        </div>
        ${itemTable}
      `,
      buttonUrl: status === "completed" ? undefined : bookingUrl,
      buttonText: status === "completed" ? undefined : "View Booking Details",
      additionalFooter: `If you have any questions, please contact our support team at support@coldflyer.com or call us.`,
    });
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err, bookingId: booking._id }, "sendBookingConfirmationEmail failed");
    return false;
  }
};

// ── Super Admin Alert Emails ─────────────────────────────────────────────────

const sendNewOrderAlertToAdmin = async (order) => {
  try {
    const adminEmail = getSuperAdminEmail();
    if (!adminEmail) return false;

    const subject = `[Admin Alert] New Order - ${order.orderNumber}`;
    const orderUrl = `${FRONTEND_URL}/dashboard/orders/${order._id}`;

    const items = order.items || [];
    const itemTable = items.length > 0 ? buildOrderTable(items) : "";

    let summaryRows = buildSummaryLine("Subtotal", formatCurrency(order.subtotal || 0));
    summaryRows += buildSummaryLine("Total", formatCurrency(order.total), { bold: true, large: true, borderTop: true });

    const customerInfo = order.user ? `Customer ID: ${order.user._id || "N/A"}` : "Guest checkout";

    const html = buildStandardEmail({
      name: "Admin",
      greeting: "New Order Alert",
      previewText: `A new order ${order.orderNumber} has been placed for ${formatCurrency(order.total)}.`,
      content: `
        <div style="margin: 16px 0; padding: 16px; background: #FEF3C7; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #92400E;">Order #${order.orderNumber}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #92400E;">Placed on ${formatDateTime(order.createdAt)}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #92400E;">Payment: ${order.paymentMethod} | Status: ${order.paymentStatus}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #92400E;">${customerInfo}</p>
        </div>
        ${itemTable}
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; margin-top: 8px;">
          ${summaryRows}
        </table>
      `,
      buttonUrl: orderUrl,
      buttonText: "View Order in Dashboard",
      additionalFooter: `This is an automated admin alert from ${BRAND_NAME}.`,
    });
    return await sendEmail(adminEmail, subject, html);
  } catch (err) {
    logger.error({ err, orderId: order._id }, "sendNewOrderAlertToAdmin failed");
    return false;
  }
};

const sendNewBookingAlertToAdmin = async (booking) => {
  try {
    const adminEmail = getSuperAdminEmail();
    if (!adminEmail) return false;

    const subject = `[Admin Alert] New Service Booking - ${booking.bookingNumber}`;
    const bookingUrl = `${FRONTEND_URL}/dashboard/bookings/${booking._id}`;

    let bookingInfo = "";
    bookingInfo += `<p style="margin: 0 0 4px; font-size: 14px;"><strong>Customer:</strong> ${booking.customerName || booking.user?.name || "N/A"}</p>`;
    bookingInfo += `<p style="margin: 0 0 4px; font-size: 14px;"><strong>Phone:</strong> ${booking.customerPhone || booking.user?.phone || "N/A"}</p>`;
    if (booking.customerEmail || booking.user?.email) {
      bookingInfo += `<p style="margin: 0 0 4px; font-size: 14px;"><strong>Email:</strong> ${booking.customerEmail || booking.user?.email}</p>`;
    }
    if (booking.service) {
      bookingInfo += `<p style="margin: 0 0 4px; font-size: 14px;"><strong>Service:</strong> ${booking.service.name || booking.service}</p>`;
    }
    if (booking.acBrand || booking.acType) {
      bookingInfo += `<p style="margin: 0; font-size: 14px;"><strong>AC:</strong> ${[booking.acBrand, booking.acModel, booking.acTon, booking.acType].filter(Boolean).join(" | ")}</p>`;
    }

    const html = buildStandardEmail({
      name: "Admin",
      greeting: "New Booking Alert",
      previewText: `A new service booking ${booking.bookingNumber} has been created.`,
      content: `
        <div style="margin: 16px 0; padding: 16px; background: #DBEAFE; border-radius: 8px; border-left: 4px solid #3B82F6;">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1E40AF;">Booking #${booking.bookingNumber}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #1E40AF;">Created on ${formatDateTime(booking.createdAt)}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #1E40AF;">Amount: ${formatCurrency(booking.total)}</p>
        </div>
        <div style="margin: 16px 0; padding: 12px 16px; background: #F9FAFB; border-radius: 8px;">
          ${bookingInfo}
        </div>
      `,
      buttonUrl: bookingUrl,
      buttonText: "View Booking in Dashboard",
      additionalFooter: `This is an automated admin alert from ${BRAND_NAME}.`,
    });
    return await sendEmail(adminEmail, subject, html);
  } catch (err) {
    logger.error({ err, bookingId: booking._id }, "sendNewBookingAlertToAdmin failed");
    return false;
  }
};

const sendNewAdminAlertToSuperAdmin = async (newAdminUser, createdByUser) => {
  try {
    const adminEmail = getSuperAdminEmail();
    if (!adminEmail) return false;

    const subject = `[Security Alert] New Admin Created - ${newAdminUser.name}`;
    const usersUrl = `${FRONTEND_URL}/dashboard/users/${newAdminUser._id}`;

    const html = buildStandardEmail({
      name: "Super Admin",
      greeting: "New Admin Account Created",
      previewText: `A new admin account has been created for ${newAdminUser.name} (${newAdminUser.email}).`,
      content: `
        <div style="margin: 16px 0; padding: 16px; background: #FEE2E2; border-radius: 8px; border-left: 4px solid #DC2626;">
          <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #991B1B;">New Admin User</p>
          <p style="margin: 0 0 4px; font-size: 14px; color: #991B1B;"><strong>Name:</strong> ${newAdminUser.name}</p>
          <p style="margin: 0 0 4px; font-size: 14px; color: #991B1B;"><strong>Email:</strong> ${newAdminUser.email}</p>
          <p style="margin: 0 0 4px; font-size: 14px; color: #991B1B;"><strong>Role:</strong> ${newAdminUser.role || "admin"}</p>
          <p style="margin: 0; font-size: 13px; color: #991B1B;"><strong>Created by:</strong> ${createdByUser ? `${createdByUser.name} (${createdByUser.email})` : "System / Registration"}</p>
        </div>
        <p style="margin: 12px 0 0; font-size: 15px;">A new admin account has been created on ${formatDateTime(new Date())}.</p>
        <p style="margin: 8px 0 0; font-size: 14px; color: #6B7280;">Please review if this action was authorized.</p>
      `,
      buttonUrl: usersUrl,
      buttonText: "View User Details",
      additionalFooter: `This is an automated security alert from ${BRAND_NAME}.`,
    });
    return await sendEmail(adminEmail, subject, html);
  } catch (err) {
    logger.error({ err, adminUserId: newAdminUser._id }, "sendNewAdminAlertToSuperAdmin failed");
    return false;
  }
};

// ── Job Application Emails ────────────────────────────────────────────────────

const sendApplicationReceivedEmail = async (email, name, position) => {
  try {
    const subject = `Application Received - ${BRAND_NAME}`;
    const html = buildStandardEmail({
      name,
      previewText: `Thank you for applying to ${BRAND_NAME}!`,
      content: `
        <p style="margin: 0 0 12px; font-size: 15px;">We have received your application for the position of <strong>${position}</strong>.</p>
        <p style="margin: 0 0 12px; font-size: 15px;">Our recruiting team will review your application and get back to you within 48 hours.</p>
        <p style="margin: 0; font-size: 15px;">If you have any questions in the meantime, feel free to reach out to us at <a href="mailto:careers@coldflyer.com" style="color: ${COLORS.primary};">careers@coldflyer.com</a>.</p>
      `,
    });
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err }, "sendApplicationReceivedEmail failed");
    return false;
  }
};

const sendApplicationApprovedEmail = async (email, name) => {
  try {
    const subject = `Welcome to ${BRAND_NAME} — Your Application is Approved!`;
    const dashboardUrl = `${FRONTEND_URL}/dashboard`;
    const html = buildStandardEmail({
      name,
      previewText: `Congratulations! Your application to ${BRAND_NAME} has been approved.`,
      content: `
        <p style="margin: 0 0 12px; font-size: 15px;">We are pleased to inform you that your application has been approved.</p>
        <p style="margin: 0 0 12px; font-size: 15px;">You are now part of the ${BRAND_NAME} team as a technician. You can log in to your dashboard to view your profile and manage your service bookings.</p>
      `,
      buttonUrl: dashboardUrl,
      buttonText: "Go to Dashboard",
    });
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err }, "sendApplicationApprovedEmail failed");
    return false;
  }
};

const sendApplicationRejectedEmail = async (email, name, reason) => {
  try {
    const subject = `Update on Your ${BRAND_NAME} Application`;
    const html = buildStandardEmail({
      name,
      previewText: `Update on your ${BRAND_NAME} application status.`,
      content: `
        <p style="margin: 0 0 12px; font-size: 15px;">Thank you for your interest in joining ${BRAND_NAME}.</p>
        <p style="margin: 0 0 12px; font-size: 15px;">After careful review, we regret to inform you that we are unable to move forward with your application at this time.</p>
        ${reason ? `<div style="margin: 16px 0; padding: 12px 16px; background: #F9FAFB; border-radius: 8px;"><p style="margin: 0; font-size: 14px; color: #6B7280;"><strong>Feedback:</strong> ${reason}</p></div>` : ""}
        <p style="margin: 0; font-size: 15px;">We encourage you to apply again in the future when new opportunities arise.</p>
      `,
    });
    return await sendEmail(email, subject, html);
  } catch (err) {
    logger.error({ err }, "sendApplicationRejectedEmail failed");
    return false;
  }
};

module.exports = {
  // Auth & Security
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendVerificationCode,

  // Orders
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,

  // Bookings
  sendBookingConfirmationEmail,

  // Admin Alerts
  sendNewOrderAlertToAdmin,
  sendNewBookingAlertToAdmin,
  sendNewAdminAlertToSuperAdmin,

  // Job Applications
  sendApplicationReceivedEmail,
  sendApplicationApprovedEmail,
  sendApplicationRejectedEmail,

  // Utilities (for external use)
  getRecipientName,
  getRecipientEmail,
};
