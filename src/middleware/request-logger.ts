import type { Request, Response, NextFunction } from 'express';

/**
 * Task 3 requirement:
 * Logs ISO timestamp, HTTP method, URL path, and processing time in ms.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const line = [
      `[${timestamp}]`,
      `${req.method}`,
      `${req.originalUrl}`,
      `${res.statusCode}`,
      `${durationMs.toFixed(2)}ms`,
    ].join(' ');

    // Use stdout/stderr so container logs (Task 7) capture it cleanly.
    if (res.statusCode >= 500) console.error(line);
    else console.log(line);
  });

  next();
}