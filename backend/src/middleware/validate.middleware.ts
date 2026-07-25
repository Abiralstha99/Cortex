import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import * as z from "zod";

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: z.flattenError(result.error),
      });
    }
    req.body = result.data;
    next();
  };
}

export function validateParams<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: z.flattenError(result.error),
      });
    }
    req.params = result.data as typeof req.params;
    next();
  };
}
