import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Adds the Authorization header to every API request.
 * "X-Requested-With" tells Spring Security this is an AJAX call, so on a 401 it does not
 * trigger the browser's native login popup.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  const headers: Record<string, string> = { 'X-Requested-With': 'XMLHttpRequest' };
  const authorization = inject(AuthService).authorizationHeader;
  if (authorization && !req.headers.has('Authorization')) {
    headers['Authorization'] = authorization;
  }
  return next(req.clone({ setHeaders: headers }));
};
