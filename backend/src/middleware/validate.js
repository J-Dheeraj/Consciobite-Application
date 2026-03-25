const AppError = require("../utils/AppError");

/**
 * Creates validation middleware from a schema object.
 * Schema format: { body: { field: { required, type, min, max, pattern, message } } }
 */
function validate(schema) {
  return (req, _res, next) => {
    const errors = [];

    for (const [source, fields] of Object.entries(schema)) {
      const data = req[source] || {};

      for (const [field, rules] of Object.entries(fields)) {
        const value = data[field];

        if (rules.required && (value === undefined || value === null || value === "")) {
          errors.push(rules.message || `${field} is required`);
          continue;
        }

        if (value === undefined || value === null) continue;

        if (rules.type === "string" && typeof value !== "string") {
          errors.push(`${field} must be a string`);
        }

        if (rules.type === "number" && typeof value !== "number") {
          errors.push(`${field} must be a number`);
        }

        if (rules.min !== undefined && typeof value === "number" && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }

        if (rules.max !== undefined && typeof value === "number" && value > rules.max) {
          errors.push(`${field} must be at most ${rules.max}`);
        }

        if (
          rules.minLength !== undefined &&
          typeof value === "string" &&
          value.length < rules.minLength
        ) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }

        if (
          rules.maxLength !== undefined &&
          typeof value === "string" &&
          value.length > rules.maxLength
        ) {
          errors.push(`${field} must be at most ${rules.maxLength} characters`);
        }

        if (rules.pattern && typeof value === "string" && !rules.pattern.test(value)) {
          errors.push(rules.message || `${field} has invalid format`);
        }
      }
    }

    if (errors.length > 0) {
      return next(new AppError(errors[0], 400));
    }

    next();
  };
}

module.exports = { validate };
