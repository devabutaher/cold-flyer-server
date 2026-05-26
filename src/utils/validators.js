const { z } = require("zod");

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
        code: "VALIDATION_ERROR",
      });
    }
    next(error);
  }
};

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const emailSchema = z.string().email("Invalid email format");

const phoneSchema = z
  .string()
  .min(10, "Phone must be at least 10 digits")
  .regex(/^\+?[\d\s-]+$/, "Invalid phone number format");

module.exports = { validate, passwordSchema, emailSchema, phoneSchema };
