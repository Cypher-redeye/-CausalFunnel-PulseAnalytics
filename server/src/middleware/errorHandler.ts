import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

// Consistent API response format
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Validation error handler middleware
export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: 'path' in err ? err.path : 'unknown',
        message: err.msg,
      })),
    };
    res.status(400).json(response);
    return;
  }
  next();
}

// Global error handler
export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Unhandled error:', err);

  const isProduction = process.env.NODE_ENV === 'production';
  const response: ApiResponse = {
    success: false,
    error: isProduction ? 'Internal server error' : err.message,
  };

  res.status(500).json(response);
}

// 404 handler
export function notFoundHandler(_req: Request, res: Response): void {
  const response: ApiResponse = {
    success: false,
    error: 'Resource not found',
  };
  res.status(404).json(response);
}
