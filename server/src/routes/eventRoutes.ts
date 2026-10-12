import { Router } from 'express';
import {
  createEvent,
  getSessions,
  getSessionEvents,
  getHeatmapData,
  getOverview,
  getTrackedPages,
  healthCheck,
} from '../controllers/eventController';
import {
  validateEvent,
  validateClickEvent,
  validateSessionId,
  validateHeatmapQuery,
  validatePagination,
} from '../validators/eventValidators';
import { handleValidationErrors } from '../middleware/errorHandler';

const router = Router();

// Health check
router.get('/health', healthCheck);

// Overview stats
router.get('/overview', getOverview);

// Events
router.post(
  '/events',
  [...validateEvent, ...validateClickEvent],
  handleValidationErrors,
  createEvent
);

// Sessions
router.get('/sessions', validatePagination, handleValidationErrors, getSessions);

router.get(
  '/sessions/:sessionId/events',
  [...validateSessionId, ...validatePagination],
  handleValidationErrors,
  getSessionEvents
);

// Heatmap
router.get(
  '/heatmap',
  [...validateHeatmapQuery],
  handleValidationErrors,
  getHeatmapData
);

// Tracked pages
router.get('/pages', getTrackedPages);

export default router;
