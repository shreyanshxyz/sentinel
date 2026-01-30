import { Request, Response, NextFunction } from "express";
import { ApiException, ApiResponse } from "../types/api.types.js";
import { ZodError } from "zod";
import { logger } from "../utils/logger.js";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error("Error occurred", { error: err.message, stack: err.stack });

  if (err instanceof ApiException) {
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof ZodError) {
    const issues = err.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: issues,
      },
    };
    res.status(400).json(response);
    return;
  }

  const response: ApiResponse<never> = {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  };
  res.status(500).json(response);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const response: ApiResponse<never> = {
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
  };
  res.status(404).json(response);
};
