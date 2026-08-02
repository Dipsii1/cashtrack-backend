export const ApiSuccess = {
  UPDATED: "Updated successfully",
  DELETED: "Deleted successfully",
} as const;

export const AuthMessages = {
  REGISTER_SUCCESS: "Registration successful",
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  REFRESH_SUCCESS: "Token refreshed successfully",
} as const;

export const ErrorMessages = {
  INVALID_CREDENTIALS: "Invalid email or password",
  EMAIL_IN_USE: "Email is already registered",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden: insufficient permissions",
  NOT_FOUND: "Resource not found",
  INVALID_REFRESH_TOKEN: "Invalid refresh token",
  TOKEN_EXPIRED: "Token expired",
  VALIDATION: "Validation Error",
  INTERNAL: "Internal server error",
} as const;
