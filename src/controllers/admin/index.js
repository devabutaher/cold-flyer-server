const { getDashboard, getAnalytics } = require("./dashboard.controller");
const { getAllUsers, getUser, updateUserRole, deleteUser } = require("./users.controller");
const { getAllProducts } = require("./products.controller");
const { getAllOrders } = require("./orders.controller");
const { getAllServices } = require("./services.controller");
const { getAllReviews } = require("./reviews.controller");
const { createCoupon, getCoupons, updateCoupon, deleteCoupon, toggleCouponStatus } = require("./coupons.controller");
const {
  getTechnicians,
  createTechnician,
  getTechnician,
  updateTechnician,
  deleteTechnician,
} = require("./technicians.controller");
const {
  getApplications,
  getApplication,
  approveApplication,
  rejectApplication,
  deleteApplication,
} = require("../jobApplication.controller");

module.exports = {
  getDashboard,
  getAnalytics,
  getAllUsers,
  getUser,
  updateUserRole,
  deleteUser,
  getAllProducts,
  getAllOrders,
  getAllServices,
  getAllReviews,
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getTechnicians,
  createTechnician,
  getTechnician,
  updateTechnician,
  deleteTechnician,
  getApplications,
  getApplication,
  approveApplication,
  rejectApplication,
  deleteApplication,
};
