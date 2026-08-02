export class AppError extends Error {
  public readonly statusCode: number;
  public isOperational: boolean;
  public readonly errors?: Record<string, string[]>;

  constructor(message: string, statusCode = 500, errors?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message = "Bad Request", errors?: Record<string, string[]>): AppError {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError(message, 403);
  }

  static notFound(message = "Resource not found"): AppError {
    return new AppError(message, 404);
  }

  static conflict(message = "Conflict"): AppError {
    return new AppError(message, 409);
  }

  static internal(message = "Internal Server Error"): AppError {
    const err = new AppError(message, 500);
    err.isOperational = false;
    return err;
  }
}