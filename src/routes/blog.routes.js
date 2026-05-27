const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { blogSchema, blogQuerySchema } = require("../validators/blog.validator");
const {
  getBlogs,
  getBlogBySlug,
  getBlogById,
  getFeaturedBlogs,
  getBlogCategories,
  createBlog,
  updateBlog,
  deleteBlog,
} = require("../controllers/blog.controller");

// Public routes
router.get("/featured", getFeaturedBlogs);
router.get("/categories", getBlogCategories);
router.get("/slug/:slug", getBlogBySlug);
router.get("/", validate(blogQuerySchema), getBlogs);
router.get("/:id", getBlogById);

// Admin & Moderator routes
router.post("/", authenticate, authorize("admin", "moderator"), validate(blogSchema), createBlog);
router.patch("/:id", authenticate, authorize("admin", "moderator"), updateBlog);
router.delete("/:id", authenticate, authorize("admin", "moderator"), deleteBlog);

module.exports = router;
