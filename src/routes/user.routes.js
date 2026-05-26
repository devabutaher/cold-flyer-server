const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { uploadSingle } = require("../middleware/upload.middleware");
const {
  getProfile,
  updateProfile,
  updateAvatar,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getOrders,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/user.controller");

router.use(authenticate);

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.post("/avatar", uploadSingle("avatar"), updateAvatar);
router.patch("/avatar", uploadSingle("avatar"), updateAvatar);

router.get("/addresses", getAddresses);
router.post("/addresses", addAddress);
router.patch("/addresses/:id", updateAddress);
router.delete("/addresses/:id", deleteAddress);
router.patch("/default-address/:id", setDefaultAddress);

router.get("/orders", getOrders);

router.get("/wishlist", getWishlist);
router.post("/wishlist/:productId", addToWishlist);
router.delete("/wishlist/:productId", removeFromWishlist);

router.get("/notifications", getNotifications);
router.patch("/notifications/:id/read", markNotificationRead);
router.patch("/notifications/read-all", markAllNotificationsRead);

module.exports = router;
