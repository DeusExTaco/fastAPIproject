// src/types/errors/ProfileServiceError.ts

interface ErrorDetails {
  status?: number;
  originalError?: unknown;
  code?: string;
  field?: string;
  validationErrors?: Record<string, string[]>;
  requestInfo?: {
    method?: string;
    url?: string;
    timestamp?: string;
  };
  timestamp?: string;  // Add this line
}

export class ProfileServiceError extends Error {
  readonly details: ErrorDetails;
  readonly timestamp: Date;

  constructor(message: string, details?: ErrorDetails) {
    super(message);

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, ProfileServiceError.prototype);

    // Set the name for better error identification
    this.name = 'ProfileServiceError';

    // Initialize details with defaults
    this.details = {
      ...details,
      timestamp: new Date().toISOString()
    };

    // Capture timestamp for error tracking
    this.timestamp = new Date();

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProfileServiceError);
    }
  }

  // Returns a formatted string representation of the error
  toString(): string {
    const parts = [
      `${this.name}: ${this.message}`,
      `Timestamp: ${this.timestamp.toISOString()}`
    ];

    if (this.details.status) {
      parts.push(`Status: ${this.details.status}`);
    }

    if (this.details.code) {
      parts.push(`Code: ${this.details.code}`);
    }

    if (this.details.validationErrors) {
      parts.push('Validation Errors:');
      Object.entries(this.details.validationErrors).forEach(([field, errors]) => {
        parts.push(`  ${field}: ${errors.join(', ')}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Creates an error instance for network failures
   */
  static networkError(originalError: Error): ProfileServiceError {
    console.log('Network Error:', originalError);
    return new ProfileServiceError(
      'Network connection failed. Please check your internet connection.',
      {
        originalError: originalError.name + " : " + originalError.message,
        code: 'NETWORK_ERROR',
        status: 0
      }
    );
  }


  /**
   * Creates an error instance for authentication failures
   */
  static authError(status: number, message?: string): ProfileServiceError {
    return new ProfileServiceError(
      message || 'Authentication failed. Please log in again.',
      {
        status,
        code: 'AUTH_ERROR'
      }
    );
  }

  /**
   * Creates an error instance for validation failures
   */
  static validationError(
    errors: Record<string, string[]>,
    message?: string
  ): ProfileServiceError {
    return new ProfileServiceError(
      message || 'Validation failed. Please check your input.',
      {
        status: 400,
        code: 'VALIDATION_ERROR',
        validationErrors: errors
      }
    );
  }
}