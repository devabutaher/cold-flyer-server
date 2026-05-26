const { z } = require("zod");
const ApiError = require("../utils/ApiError");

const validate = (schema) => (req, res, next) => {
  try {
    if (schema.params) {
      schema.params.parse(req.params);
    }
    if (schema.query) {
      schema.query.parse(req.query);
    }
    if (schema.body) {
      schema.body.parse(req.body);
    }
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return next(ApiError.badRequest("Validation failed", errors));
    }
    next(error);
  }
};

module.exports = { validate };
