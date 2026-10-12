import { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/eventService';
import { ApiResponse } from '../middleware/errorHandler';

/**
 * POST /api/events
 * Receive and store an analytics event
 */
export async function createEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { session_id, event_type, page_url, timestamp, coordinates, viewport } = req.body;

    // Additional validation: click events must have coordinates
    if (event_type === 'click' && (!coordinates || coordinates.x === undefined || coordinates.y === undefined)) {
      const response: ApiResponse = {
        success: false,
        error: 'Click events require coordinates with x and y values',
      };
      res.status(400).json(response);
      return;
    }

    const event = await eventService.createEvent({
      session_id,
      event_type,
      page_url,
      timestamp: new Date(timestamp),
      coordinates: event_type === 'click' ? coordinates : undefined,
      viewport: viewport || undefined,
    });

    const response: ApiResponse = {
      success: true,
      data: event,
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/sessions
 * Return all sessions with analytics summaries
 */
export async function getSessions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await eventService.getSessions(page, limit);

    const response: ApiResponse = {
      success: true,
      data: result.data,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/sessions/:sessionId/events
 * Retrieve events for a specific session
 */
export async function getSessionEvents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sessionId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const result = await eventService.getSessionEvents(sessionId, page, limit);

    if (result.total === 0) {
      const response: ApiResponse = {
        success: false,
        error: `No events found for session: ${sessionId}`,
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: result.data,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/heatmap
 * Retrieve click data for heatmap visualization
 */
export async function getHeatmapData(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pageUrl = req.query.page_url as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 1000, 5000);

    if (!pageUrl) {
      const response: ApiResponse = {
        success: false,
        error: 'page_url query parameter is required',
      };
      res.status(400).json(response);
      return;
    }

    const result = await eventService.getHeatmapData(pageUrl, limit);

    const response: ApiResponse = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/overview
 * Get dashboard overview statistics
 */
export async function getOverview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [stats, eventsOverTime, recentSessions] = await Promise.all([
      eventService.getOverviewStats(),
      eventService.getEventsOverTime(30),
      eventService.getSessions(1, 5),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        stats,
        events_over_time: eventsOverTime,
        recent_sessions: recentSessions.data,
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/pages
 * Get list of tracked pages (for heatmap page selector)
 */
export async function getTrackedPages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pages = await eventService.getTrackedPages();

    const response: ApiResponse = {
      success: true,
      data: pages,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/health
 * Check server and database health
 */
export async function healthCheck(
  _req: Request,
  res: Response
): Promise<void> {
  const { isDatabaseConnected } = await import('../config/database');

  const dbConnected = isDatabaseConnected();
  const status = dbConnected ? 'healthy' : 'degraded';

  const response: ApiResponse = {
    success: dbConnected,
    data: {
      status,
      api: 'running',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  };

  res.status(dbConnected ? 200 : 503).json(response);
}
