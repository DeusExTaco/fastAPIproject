// src/types/errors/ProfileServiceError.ts
export class ProfileServiceError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ProfileServiceError';
  }
}