const Notification = require('../models/Notification');

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
    console.error('Error creating notification:', error);
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

  return createNotification(userId, 'order_update', 'Order Update', messages[status] || `Order ${order.orderNumber} updated`, {
    orderId: order._id,
    url: `/orders/${order._id}`,
  });
};

const createPaymentNotification = async (userId, order, status) => {
  const messages = {
    paid: `Payment received for order ${order.orderNumber}`,
    failed: `Payment failed for order ${order.orderNumber}`,
    refunded: `Payment refunded for order ${order.orderNumber}`,
  };

  return createNotification(userId, 'payment', 'Payment Update', messages[status] || 'Payment updated', {
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

  return createNotification(userId, 'service', 'Service Update', messages[status] || 'Service updated', {
    serviceId: booking._id,
    url: `/bookings/${booking._id}`,
  });
};

const getUserNotifications = async (userId, page = 1, limit = 20) => {
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
};

const markAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

const markAllAsRead = async (userId) => {
  return Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
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