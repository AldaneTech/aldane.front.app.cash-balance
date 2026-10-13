import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthGuard } from './auth.guard';
import { AuthFrontService } from './auth.service';

describe('AuthGuard', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [RouterTestingModule] }));
  afterEach(() => localStorage.removeItem('auth_token'));
  it('redirects an expired session from child navigation and removes the stale token', () => {
    localStorage.setItem('auth_token', 'invalid-token');
    const result = TestBed.inject(AuthGuard).canActivateChild();
    expect(TestBed.inject(Router).serializeUrl(result as any)).toBe('/login?reason=session-expired');
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
  it('redirects a visitor without claiming their session has expired', () => {
    localStorage.removeItem('auth_token');
    const result = TestBed.inject(AuthGuard).canActivate();
    expect(TestBed.inject(Router).serializeUrl(result as any)).toBe('/login');
  });
  it('allows navigation for an active session', () => {
    spyOn(TestBed.inject(AuthFrontService), 'isLoggedIn').and.returnValue(true);
    expect(TestBed.inject(AuthGuard).canActivateChild()).toBeTrue();
  });
});
