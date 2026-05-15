const { getDashboard, getAnalytics } = require('./dashboard.controller');
const { getAllUsers, updateUserRole } = require('./users.controller');
const { getAllProducts } = require('./products.controller');
const { getAllOrders } = require('./orders.controller');
const { getAllServices } = require('./services.controller');
const { getAllReviews } = require('./reviews.controller');
const { createCoupon, getCoupons, updateCoupon, deleteCoupon } = require('./coupons.controller');
const { getTechnicians, createTechnician, getTechnician, updateTechnician, deleteTechnician } = require('./technicians.controller');

module.exports = {
  getDashboard,
  getAnalytics,
  getAllUsers,
  updateUserRole,
  getAllProducts,
  getAllOrders,
  getAllServices,
  getAllReviews,
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  getTechnicians,
  createTechnician,
  getTechnician,
  updateTechnician,
  deleteTechnician,
};
