import { TestBed } from '@angular/core/testing';
import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Configuration } from '@aldanetech/cash-balance-api-client-angular';
import { SessionInterceptor } from './session.interceptor';

const base = 'http://localhost/cash-balance';
describe('SessionInterceptor', () => {
  let http: HttpClient;
  let requests: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigate'], { url: '/transactions' });
    router.navigate.and.returnValue(Promise.resolve(true));
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: Configuration, useValue: new Configuration({ basePath: base }) },
        { provide: Router, useValue: router },
        { provide: HTTP_INTERCEPTORS, useClass: SessionInterceptor, multi: true }
      ]
    });
    http = TestBed.inject(HttpClient); requests = TestBed.inject(HttpTestingController);
    localStorage.setItem('auth_token', 'current-session');
  });
  afterEach(() => { requests.verify(); localStorage.removeItem('auth_token'); });
  const reject = (requests: HttpTestingController, url: string, status: number) => requests.expectOne(url).flush({}, { status, statusText: 'Rejected' });
  it('clears the token, redirects once and propagates concurrent unauthorized errors', () => {
    const errors: number[] = [];
    for (const path of ['/wallets', '/me']) http.get(base + path).subscribe({ error: error => errors.push(error.status) });
    reject(requests, base + '/wallets', 401); reject(requests, base + '/me', 401);
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/login'], { queryParams: { reason: 'session-expired' }, replaceUrl: true });
    expect(errors).toEqual([401, 401]);
  });
  it('does not expire sessions for login, registration, external URLs or forbidden responses', () => {
    for (const url of [base + '/login', base + '/createUser', 'https://example.com/me']) {
      http.post(url, {}).subscribe({ error: () => {} }); reject(requests, url, 401);
    }
    http.get(base + '/me').subscribe({ error: () => {} }); reject(requests, base + '/me', 403);
    expect(localStorage.getItem('auth_token')).toBe('current-session');
    expect(router.navigate).not.toHaveBeenCalled();
  });
  it('ignores a late 401 from a previous session after the user logs in again', () => {
    http.get(base + '/me').subscribe({ error: () => {} });
    localStorage.setItem('auth_token', 'new-session');
    reject(requests, base + '/me', 401);
    expect(localStorage.getItem('auth_token')).toBe('new-session');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
