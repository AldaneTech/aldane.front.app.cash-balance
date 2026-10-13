import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Configuration } from '@aldanetech/cash-balance-api-client-angular';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { CashBalanceService, Resource, resource, yearToDate } from './cash-balance.service';

describe('CashBalanceService', () => {
  afterEach(() => { TestBed.inject(HttpTestingController).verify(); localStorage.removeItem('auth_token'); });
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [{ provide: Configuration, useValue: new Configuration({ basePath: 'http://localhost/cash-balance/' }) }]
  }));
  it('sends authenticated movement filters and omits unset parameters', () => {
    localStorage.setItem('auth_token', 'test-token');
    TestBed.inject(CashBalanceService).entries({ walletId: 7, from: '2026-01-01', page: 0, categoryId: undefined }).subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne(r => r.url === 'http://localhost/cash-balance/account-entries');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(request.request.params.get('walletId')).toBe('7');
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.has('categoryId')).toBeFalse();
    request.flush({ items: [], page: 0, size: 10, totalElements: 0, totalPages: 0 });
  });
  it('loads only the authenticated user catalogs and excludes archived options', () => {
    let result: any;
    TestBed.inject(CashBalanceService).myCatalogs().subscribe(data => result = data);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('http://localhost/cash-balance/me').flush({ id: 7 });
    http.expectOne('http://localhost/cash-balance/getCategories/7').flush([{ id: 1, status: { id: 1 } }, { id: 2, status: { id: 2 } }]);
    http.expectOne('http://localhost/cash-balance/getBrands/7').flush([]);
    http.expectOne('http://localhost/cash-balance/getStores/7').flush([]);
    expect(result.Category.map((item: any) => item.id)).toEqual([1]);
  });
  it('restricts annual totals to the year through today', () => {
    expect(yearToDate(new Date('2026-10-12T10:00:00Z'))).toEqual({ year: 2026, from: '2026-01-01', to: '2026-10-12', monthCount: 10 });
  });
  it('shows cached views immediately on return while fetching current data', () => {
    const api = TestBed.inject(CashBalanceService);
    api.view('test', of('all'), () => of({ total: 10 })).subscribe();
    const response = new Subject<{ total: number }>();
    const values: Resource<{ total: number }>[] = [];
    api.view('test', of('all'), () => response).subscribe(value => values.push(value));
    expect(values[0]).toEqual({ loading: true, data: { total: 10 } });
    response.next({ total: 20 });
    expect(values[1]).toEqual({ loading: false, data: { total: 20 } });
  });
  it('separates cached selections and invalidates them after writes or session changes', () => {
    const api = TestBed.inject(CashBalanceService);
    api.view('test', of(1), () => of('wallet-one')).subscribe();
    const response = new Subject<string>();
    let result: Resource<string> | undefined;
    const check = (id: number) => api.view('test', of(id), () => response).subscribe(value => result = value);
    check(2); expect(result?.data).toBeUndefined();
    api.deleteEntry(10).subscribe();
    TestBed.inject(HttpTestingController).expectOne('http://localhost/cash-balance/deleteAccountEntry/10').flush(null);
    check(1); expect(result?.data).toBeUndefined();
    api.view('test', of(1), () => of('old-session')).subscribe();
    localStorage.setItem('auth_token', 'different-session');
    check(1); expect(result?.data).toBeUndefined();
  });
  it('retains visible data if a background refresh fails', () => {
    const trigger = new BehaviorSubject(0);
    const response = new Subject<string>();
    let result: Resource<string> | undefined;
    resource(trigger, id => id === 0 ? of('visible') : response).subscribe(value => result = value);
    trigger.next(1); response.error(new Error('Offline'));
    expect(result?.data).toBe('visible'); expect(result?.error).toBeTruthy();
    expect(result?.loading).toBeFalse();
  });

});
