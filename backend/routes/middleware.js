/**
 * DecodeLabs Task Manager — middleware.js
 * Project 2: Validation Middleware
 * 
 * "The Gatekeeper Rule: Never Trust the Client."
 * Syntactic Validation: Is the format correct?
 * Semantic Validation:  Is the logic valid?
 */

const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_STATUSES   = ['pending', 'completed'];

/**
 * Validate task body for CREATE (POST)
 * Returns 400 Bad Request if invalid
 */
function validateCreateTask(req, res, next) {
  const { title, priority } = req.body;
  const errors = [];

  // Syntactic: required field present?
  if (!title || typeof title !== 'string') {
    errors.push({ field: 'title', message: 'Title is required and must be a string.' });
  } else if (title.trim().length < 3) {
    // Semantic: does value meet business logic?
    errors.push({ field: 'title', message: 'Title must be at least 3 characters.' });
  } else if (title.trim().length > 120) {
    errors.push({ field: 'title', message: 'Title must not exceed 120 characters.' });
  }

  if (!priority) {
    errors.push({ field: 'priority', message: 'Priority is required.' });
  } else if (!VALID_PRIORITIES.includes(priority)) {
    errors.push({ field: 'priority', message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}.` });
  }

  if (req.body.description && req.body.description.length > 500) {
    errors.push({ field: 'description', message: 'Description must not exceed 500 characters.' });
  }

  if (req.body.due_date && isNaN(Date.parse(req.body.due_date))) {
    errors.push({ field: 'due_date', message: 'due_date must be a valid date string (YYYY-MM-DD).' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error:   'Validation failed.',
      details: errors,
    });
  }

  next();
}

/**
 * Validate task body for UPDATE (PUT)
 */
function validateUpdateTask(req, res, next) {
  const { title, priority, status } = req.body;
  const errors = [];

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Title must be at least 3 characters.' });
    }
    if (title.trim().length > 120) {
      errors.push({ field: 'title', message: 'Title must not exceed 120 characters.' });
    }
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    errors.push({ field: 'priority', message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}.` });
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${VALID_STATUSES.join(', ')}.` });
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', details: errors });
  }

  next();
}

module.exports = { validateCreateTask, validateUpdateTask };
