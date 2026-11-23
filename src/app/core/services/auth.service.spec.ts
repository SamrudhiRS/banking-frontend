import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ACCOUNTS_URL, USERS_URL } from './api.config';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const router = { navigate: jest.fn().mockResolvedValue(true) };

  beforeEach(() => {
    sessionStorage.clear();
    router.navigate.mockClear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: router }],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts logged out', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.authorizationHeader).toBeNull();
  });

  it('stores the session after a successful login', () => {
    service.login('admin', 'secret').subscribe();

    const request = http.expectOne(ACCOUNTS_URL);
    expect(request.request.headers.get('Authorization')).toBe(`Basic ${btoa('admin:secret')}`);
    request.flush([]);

    expect(service.isLoggedIn()).toBe(true);
    expect(service.username()).toBe('admin');
    expect(service.authorizationHeader).toBe(`Basic ${btoa('admin:secret')}`);
    expect(sessionStorage.getItem('banking.session')).not.toBeNull();
  });

  it('does not store anything when the login is rejected', () => {
    let failed = false;
    service.login('admin', 'wrong').subscribe({ error: () => (failed = true) });

    http.expectOne(ACCOUNTS_URL).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBe(true);
    expect(service.isLoggedIn()).toBe(false);
    expect(sessionStorage.getItem('banking.session')).toBeNull();
  });

  it('registers a user with the ROLE_USER role', () => {
    service.register('newuser', 'pass123').subscribe();

    const request = http.expectOne(USERS_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      username: 'newuser',
      password: 'pass123',
      active: true,
      role: 'ROLE_USER',
    });
    request.flush({});
  });

  it('clears the session and redirects to the login page on logout', () => {
    service.login('admin', 'secret').subscribe();
    http.expectOne(ACCOUNTS_URL).flush([]);

    service.logout();

    expect(service.isLoggedIn()).toBe(false);
    expect(sessionStorage.getItem('banking.session')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
