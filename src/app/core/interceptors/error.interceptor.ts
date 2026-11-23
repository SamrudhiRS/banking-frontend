import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Error with a message that is safe to show to the user. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Turns the backend's ProblemDetail response (or a network failure) into a friendly message. */
export function toFriendlyMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Cannot reach the server. Please check that the backend is running.';
  }
  if (error.status === 401) {
    return 'Invalid username or password.';
  }
  const detail: unknown = error.error?.detail;
  if (typeof detail === 'string' && detail.length > 0) {
    return detail.startsWith('Validation failed') ? 'Please check the values you entered.' : detail;
  }
  if (error.status >= 500) {
    return 'Something went wrong on the server. Please try again.';
  }
  return 'The request could not be completed.';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // A 401 while we think we are logged in means the session is no longer valid.
      if (error.status === 401 && auth.isLoggedIn()) {
        auth.logout();
      }
      return throwError(() => new ApiError(error.status, toFriendlyMessage(error)));
    }),
  );
};
