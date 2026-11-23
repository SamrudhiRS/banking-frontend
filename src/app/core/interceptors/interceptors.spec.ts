import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';
import { ApiError, errorInterceptor } from './error.interceptor';

describe('HTTP interceptors', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  const auth = {
    authorizationHeader: 'Basic abc123' as string | null,
    isLoggedIn: jest.fn().mockReturnValue(true),
    logout: jest.fn(),
  };

  beforeEach(() => {
    auth.authorizationHeader = 'Basic abc123';
    auth.isLoggedIn.mockReturnValue(true);
    auth.logout.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('adds the Authorization and X-Requested-With headers to API calls', () => {
    http.get('/api/test').subscribe();

    const request = controller.expectOne('/api/test');
    expect(request.request.headers.get('Authorization')).toBe('Basic abc123');
    expect(request.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
    request.flush({});
  });

  it('does not add credentials to non-API requests', () => {
    http.get('/assets/logo.png').subscribe();

    const request = controller.expectOne('/assets/logo.png');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('turns a ProblemDetail response into a readable ApiError', () => {
    let error: ApiError | undefined;
    http.get('/api/test').subscribe({ error: (e: ApiError) => (error = e) });

    controller
      .expectOne('/api/test')
      .flush({ detail: 'Balance is not sufficient to make transaction' }, { status: 422, statusText: 'Unprocessable' });

    expect(error).toBeInstanceOf(ApiError);
    expect(error?.status).toBe(422);
    expect(error?.message).toBe('Balance is not sufficient to make transaction');
  });

  it('shows a friendly message for validation errors', () => {
    let error: ApiError | undefined;
    http.get('/api/test').subscribe({ error: (e: ApiError) => (error = e) });

    controller
      .expectOne('/api/test')
      .flush({ detail: 'Validation failed for argument [0] ...' }, { status: 400, statusText: 'Bad Request' });

    expect(error?.message).toBe('Please check the values you entered.');
  });

  it('reports an unreachable server', () => {
    let error: ApiError | undefined;
    http.get('/api/test').subscribe({ error: (e: ApiError) => (error = e) });

    controller.expectOne('/api/test').error(new ProgressEvent('error'));

    expect(error?.status).toBe(0);
    expect(error?.message).toContain('Cannot reach the server');
  });

  it('logs the user out when a logged-in session gets a 401', () => {
    http.get('/api/test').subscribe({ error: () => undefined });

    controller.expectOne('/api/test').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).toHaveBeenCalled();
  });
});
