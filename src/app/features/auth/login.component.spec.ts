import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiError } from '../../core/interceptors/error.interceptor';
import { AuthService } from '../../core/services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let router: Router;
  const auth = { login: jest.fn() };

  beforeEach(async () => {
    auth.login.mockReset();
    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Template members are `protected`; bracket access lets the tests reach them.
  it('does not call the API while the form is invalid', () => {
    component['submit']();

    expect(auth.login).not.toHaveBeenCalled();
    expect(component['form'].invalid).toBe(true);
  });

  it('logs in and goes to the dashboard', () => {
    auth.login.mockReturnValue(of(undefined));
    component['form'].setValue({ username: 'admin', password: 'secret' });

    component['submit']();

    expect(auth.login).toHaveBeenCalledWith('admin', 'secret');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('shows the error message when login fails', () => {
    auth.login.mockReturnValue(throwError(() => new ApiError(401, 'Invalid username or password.')));
    component['form'].setValue({ username: 'admin', password: 'bad' });

    component['submit']();
    fixture.detectChanges();

    expect(component['errorMessage']()).toBe('Invalid username or password.');
    expect(component['loading']()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Invalid username or password.');
  });
});
