import type { Request, Response } from 'express';
import type { ValidationError } from '../types/booking.js';

/**
 * Extracts a parameter value from request params, handling both string and array values.
 * @param params - Express request params object
 * @param key - Parameter key to extract
 * @returns The parameter value as a string
 */
export const extractParam = (params: Request['params'], key: string): string => {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
};

export const extractId = (params: Request['params'], key: string): string => extractParam(params, key);

export const extractDecodedParam = (params: Request['params'], key: string): string => {
  const value = extractParam(params, key);
  return decodeURIComponent(value);
};

export const respondNotFound = (res: Response, message: string): void => {
  res.status(404).json({ error: message });
};

/**
 * Handles validation errors by parsing error messages and returning appropriate response.
 * @param error - The error object containing validation errors
 * @param res - Express response object
 */
export const handleValidationError = (error: Error, res: Response): void => {
  try {
    const validationErrors = JSON.parse(error.message) as ValidationError[];
    res.status(400).json({ errors: validationErrors });
  } catch {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Handles service errors by determining if it's a not found error or validation error.
 * @param error - The error thrown by the service
 * @param res - Express response object
 * @param notFoundMessage - The message to check for 404 errors (e.g., 'Rocket not found')
 */
export const handleServiceError = (error: unknown, res: Response, notFoundMessage: string): void => {
  if (error instanceof Error) {
    if (error.message === notFoundMessage) {
      res.status(404).json({ error: error.message });
      return;
    }
    handleValidationError(error, res);
  } else {
    res.status(400).json({ error: 'Invalid request' });
  }
};
