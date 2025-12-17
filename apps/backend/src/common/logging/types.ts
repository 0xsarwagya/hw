import { Request, Response } from "express";
import type { Logger } from "pino";
import { RequestContext } from "./context.service";

/**
 * Extended Express Request with logger and user info
 */
export interface ExtendedRequest extends Request {
  logger?: Logger;
  user?: {
    id: string;
    email?: string;
    role?: string;
    customerId?: string;
  };
}

/**
 * Extended Express Response with request context
 */
export interface ExtendedResponse extends Response {
  requestContext?: RequestContext;
}

/**
 * Error response type
 */
export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  requestId: string;
  message?: string;
  error?: string;
}

/**
 * HttpException response type
 */
export interface HttpExceptionResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}
