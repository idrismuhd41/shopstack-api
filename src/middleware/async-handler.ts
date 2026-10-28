import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler to pipe rejections into Express's
 * next(err) flow. Without this, thrown errors inside async handlers
 * are swallowed by Express 4 and the request hangs.
 *
 * Generic over Req so typed request shapes (params, body, query)
 * are preserved without TypeScript variance errors.
 */
export function asyncHandler<
  P = Record<string, string>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Record<string, string>,
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}