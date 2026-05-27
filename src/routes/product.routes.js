const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { productSchema, productQuerySchema } = require("../validators/product.validator");
const {
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

router.get("/slug/:slug", getProductBySlug);
router.get("/", validate(productQuerySchema), getProducts);
router.get("/:id", getProductById);

router.post("/", authenticate, authorize("admin", "moderator"), validate(productSchema), createProduct);
router.patch("/:id", authenticate, authorize("admin", "moderator"), updateProduct);
router.delete("/:id", authenticate, authorize("admin", "moderator"), deleteProduct);

module.exports = router;
