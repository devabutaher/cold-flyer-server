const logger = require("../utils/logger");
const Notification = require("../models/Notification");

const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      data,
    });
    return notification;
  } catch (error) {
    logger.error({ err: error }, "Error creating notification");
    return null;
  }
};

const createOrderNotification = async (userId, order, status) => {
  const messages = {
    confirmed: `Your order ${order.orderNumber} has been confirmed`,
    processing: `Your order ${order.orderNumber} is being processed`,
    shipped: `Your order ${order.orderNumber} has been shipped`,
    delivered: `Your order ${order.orderNumber} has been delivered`,
    cancelled: `Your order ${order.orderNumber} has been cancelled`,
  };

  return createNotification(
    userId,
    "order_update",
    "Order Update",
    messages[status] || `Order ${order.orderNumber} updated`,
    {
      orderId: order._id,
      url: `/orders/${order._id}`,
    },
  );
};

const createPaymentNotification = async (userId, order, status) => {
  const messages = {
    paid: `Payment received for order ${order.orderNumber}`,
    failed: `Payment failed for order ${order.orderNumber}`,
    refunded: `Payment refunded for order ${order.orderNumber}`,
  };

  return createNotification(userId, "payment", "Payment Update", messages[status] || "Payment updated", {
    orderId: order._id,
    url: `/orders/${order._id}`,
  });
};

const createServiceNotification = async (userId, booking, status) => {
  const messages = {
    confirmed: `Your service booking ${booking.bookingNumber} has been confirmed`,
    scheduled: `Your service is scheduled for ${new Date(booking.scheduledDate).toDateString()}`,
    completed: `Your service ${booking.bookingNumber} has been completed`,
    cancelled: `Your service booking ${booking.bookingNumber} has been cancelled`,
  };

  return createNotification(userId, "service", "Service Update", messages[status] || "Service updated", {
    serviceId: booking._id,
    url: `/bookings/${booking._id}`,
  });
};

const getUserNotifications = async (userId, page = 1, limit = 20) => {
  try {
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Notification.countDocuments({ user: userId });

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error({ err: error }, "getUserNotifications failed");
    return { notifications: [], total: 0, page, totalPages: 0 };
  }
};

const markAsRead = async (notificationId, userId) => {
  try {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true, readAt: new Date() },
      { new: true },
    );
  } catch (error) {
    logger.error({ err: error }, "markAsRead failed");
    return null;
  }
};

const markAllAsRead = async (userId) => {
  try {
    return await Notification.updateMany({ user: userId, isRead: false }, { isRead: true, readAt: new Date() });
  } catch (error) {
    logger.error({ err: error }, "markAllAsRead failed");
    return { modifiedCount: 0 };
  }
};

module.exports = {
  createNotification,
  createOrderNotification,
  createPaymentNotification,
  createServiceNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
