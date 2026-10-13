import { TestBed } from '@angular/core/testing';
import { AuthFrontService } from './auth.service';

describe('AuthFrontService', () => {
  let service: AuthFrontService;

  afterEach(() => localStorage.removeItem('auth_token'));

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthFrontService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false if no token is present', () => {
    localStorage.removeItem('auth_token');
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should return true if a valid token is present', () => {
    const validToken = 'valid.token.payload'; // Mock token
    spyOn(service, 'isTokenExpired').and.returnValue(false);
    localStorage.setItem('auth_token', validToken);
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('should return false if the token is expired', () => {
    const expiredToken = 'expired.token.payload'; // Mock token
    spyOn(service, 'isTokenExpired').and.returnValue(true);
    localStorage.setItem('auth_token', expiredToken);
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should store the token on login', () => {
    const token = 'test.token';
    service.login(token);
    expect(localStorage.getItem('auth_token')).toBe(token);
  });

  it('should remove the token on logout', () => {
    localStorage.setItem('auth_token', 'test.token');
    service.logout();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('should decode a valid JWT token', () => {
    const mockToken = 'header.' + btoa(JSON.stringify({ exp: 9999999999 })) + '.signature';
    const decoded = service.decodeJwt(mockToken);
    expect(decoded).toEqual({ exp: 9999999999 });
  });

  it('should return null for an invalid JWT token', () => {
    const invalidToken = 'invalid.token';
    const decoded = service.decodeJwt(invalidToken);
    expect(decoded).toBeNull();
  });

  it('should detect an expired token', () => {
    const expiredToken = 'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 10 })) + '.signature';
    expect(service.isTokenExpired(expiredToken)).toBeTrue();
  });

  it('should detect a valid token', () => {
    const validToken = 'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1000 })) + '.signature';
    expect(service.isTokenExpired(validToken)).toBeFalse();
  });
  it('treats expiration at the current second and invalid expiration values as expired', () => {
    spyOn(Date, 'now').and.returnValue(1000000);
    for (const exp of [1000, '2000', null]) {
      const token = 'header.' + btoa(JSON.stringify({ exp })) + '.signature';
      expect(service.isTokenExpired(token)).toBeTrue();
    }
  });
  it('decodes UTF-8 base64url JWT payloads', () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ sub: 'José', exp: 9999999999 }));
    const payload = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(service.decodeJwt('header.' + payload + '.signature')?.sub).toBe('José');
  });

});
