import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard, guestGuard } from './auth.guard';

describe('route guards', () => {
  const loggedIn = signal(false);
  let router: Router;

  const run = (guard: typeof authGuard) =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  beforeEach(() => {
    loggedIn.set(false);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { isLoggedIn: loggedIn } }],
    });
    router = TestBed.inject(Router);
  });

  it('authGuard redirects anonymous users to /login', () => {
    const result = run(authGuard) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/login');
  });

  it('authGuard allows logged-in users', () => {
    loggedIn.set(true);
    expect(run(authGuard)).toBe(true);
  });

  it('guestGuard sends logged-in users to the dashboard', () => {
    loggedIn.set(true);
    const result = run(guestGuard) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/dashboard');
  });

  it('guestGuard allows anonymous users', () => {
    expect(run(guestGuard)).toBe(true);
  });
});
