const { getDashboard, getAnalytics } = require("./dashboard.controller");
const { getAllUsers, getUser, updateUserRole, deleteUser, createUser } = require("./users.controller");
const { getAllProducts } = require("./products.controller");
const { getAllOrders } = require("./orders.controller");
const { getAllServices } = require("./services.controller");
const { getAllReviews } = require("./reviews.controller");
const { createCoupon, getCoupons, updateCoupon, deleteCoupon, toggleCouponStatus } = require("./coupons.controller");
const { getWorkers, createWorker, getWorker, updateWorker, deleteWorker, createWorkerWithUser } = require("./workers.controller");
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
  createUser,
  getAllProducts,
  getAllOrders,
  getAllServices,
  getAllReviews,
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getWorkers,
  createWorker,
  getWorker,
  updateWorker,
  deleteWorker,
  createWorkerWithUser,
  getApplications,
  getApplication,
  approveApplication,
  rejectApplication,
  deleteApplication,
};
