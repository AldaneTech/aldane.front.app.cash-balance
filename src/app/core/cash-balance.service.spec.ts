import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Configuration } from '@aldanetech/cash-balance-api-client-angular';
import { CashBalanceService, yearToDate } from './cash-balance.service';

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
});
