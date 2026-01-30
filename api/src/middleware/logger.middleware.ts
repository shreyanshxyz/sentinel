import { Request, Response, NextFunction } from "express";
import { httpLogger } from "../utils/logger.js";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    httpLogger.info("HTTP Request", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });
  });

  next();
};
