import { body, query, param, ValidationChain } from 'express-validator';

export const validateEvent: ValidationChain[] = [
  body('session_id')
    .trim()
    .notEmpty()
    .withMessage('session_id is required')
    .isString()
    .withMessage('session_id must be a string')
    .isLength({ max: 128 })
    .withMessage('session_id must not exceed 128 characters'),

  body('event_type')
    .trim()
    .notEmpty()
    .withMessage('event_type is required')
    .isIn(['page_view', 'click'])
    .withMessage('event_type must be "page_view" or "click"'),

  body('page_url')
    .trim()
    .notEmpty()
    .withMessage('page_url is required')
    .isString()
    .withMessage('page_url must be a string')
    .isLength({ max: 2048 })
    .withMessage('page_url must not exceed 2048 characters'),

  body('timestamp')
    .notEmpty()
    .withMessage('timestamp is required')
    .isISO8601()
    .withMessage('timestamp must be a valid ISO 8601 date'),

  body('coordinates')
    .optional()
    .isObject()
    .withMessage('coordinates must be an object'),

  body('coordinates.x')
    .optional()
    .isNumeric()
    .withMessage('coordinates.x must be a number')
    .custom((value) => value >= 0)
    .withMessage('coordinates.x must be non-negative'),

  body('coordinates.y')
    .optional()
    .isNumeric()
    .withMessage('coordinates.y must be a number')
    .custom((value) => value >= 0)
    .withMessage('coordinates.y must be non-negative'),

  body('viewport')
    .optional()
    .isObject()
    .withMessage('viewport must be an object'),

  body('viewport.width')
    .optional()
    .isNumeric()
    .withMessage('viewport.width must be a number')
    .custom((value) => value >= 1)
    .withMessage('viewport.width must be positive'),

  body('viewport.height')
    .optional()
    .isNumeric()
    .withMessage('viewport.height must be a number')
    .custom((value) => value >= 1)
    .withMessage('viewport.height must be positive'),
];

export const validateClickEvent: ValidationChain[] = [
  body('coordinates')
    .if(body('event_type').equals('click'))
    .notEmpty()
    .withMessage('coordinates are required for click events'),

  body('coordinates.x')
    .if(body('event_type').equals('click'))
    .notEmpty()
    .withMessage('coordinates.x is required for click events'),

  body('coordinates.y')
    .if(body('event_type').equals('click'))
    .notEmpty()
    .withMessage('coordinates.y is required for click events'),
];

export const validateSessionId: ValidationChain[] = [
  param('sessionId')
    .trim()
    .notEmpty()
    .withMessage('sessionId parameter is required')
    .isString()
    .withMessage('sessionId must be a string'),
];

export const validateHeatmapQuery: ValidationChain[] = [
  query('page_url')
    .trim()
    .notEmpty()
    .withMessage('page_url query parameter is required')
    .isString()
    .withMessage('page_url must be a string'),
];

export const validatePagination: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
    .toInt(),
];
