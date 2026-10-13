import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Configuration, Wallet, AccountEntry, Category, Brand, Store, User } from '@aldanetech/cash-balance-api-client-angular';
import { Observable, concat, of, forkJoin, defer } from 'rxjs';
import { catchError, map, scan, shareReplay, switchMap, tap } from 'rxjs/operators';

// Response shapes defined in Cash Balance OpenAPI 1.4.0.
export type CatalogKind = 'Category' | 'Brand' | 'Store';
export type CatalogItem = Category;
export interface Totals { income: number; expenses: number; net: number; entryCount: number; }
export interface Summary extends Totals { balance: number; }
export interface MonthlyTotals extends Totals { month: string; }
export interface CategoryTotals extends Totals { categoryId: number | null; categoryName: string | null; }
export interface EntryPage { items: AccountEntry[]; page: number; size: number; totalElements: number; totalPages: number; }
export interface EntryFilters { walletId?: number; categoryId?: number; typeId?: number; search?: string; from?: string; to?: string; page?: number; size?: number; sortBy?: 'date' | 'amount' | 'id'; direction?: 'asc' | 'desc'; }
export interface Resource<T> { loading: boolean; data?: T; error?: string; }

export function resource<P, T>(trigger: Observable<P>, fetch: (params: P) => Observable<T>, cached?: (params: P) => T | undefined): Observable<Resource<T>> {
  return trigger.pipe(
    switchMap(params => concat(
      of<Resource<T>>({ loading: true, data: cached?.(params) }),
      fetch(params).pipe(map(data => ({ loading: false, data })), catchError(() => of<Resource<T>>({ loading: false, error: 'We could not load your data. Please try again.' })))
    )),
    scan((previous: Resource<T>, next: Resource<T>) => next.loading || next.error ? { ...next, data: next.data ?? previous.data } : next, { loading: true }),
    shareReplay({ bufferSize: 1, refCount: true })
  );
}

export function yearToDate(now = new Date()) {
  const year = now.getUTCFullYear();
  return { year, from: `${year}-01-01`, to: now.toISOString().slice(0, 10), monthCount: now.getUTCMonth() + 1 };
}

@Injectable({ providedIn: 'root' })
export class CashBalanceService {
  private readonly views = new Map<string, { data: unknown; savedAt: number }>();
  private cacheToken: string | null = null;
  private cacheRevision = 0;

  private clearViews() { this.views.clear(); this.cacheRevision++; }
  private syncSession() {
    const token = localStorage.getItem('auth_token');
    if (token !== this.cacheToken) { this.clearViews(); this.cacheToken = token; }
  }

  view<P, T>(name: string, trigger: Observable<P>, fetch: (params: P) => Observable<T>): Observable<Resource<T>> {
    const key = (params: P) => `${name}:${JSON.stringify(params)}`;
    return resource(trigger, params => defer(() => {
      this.syncSession();
      const revision = this.cacheRevision;
      const token = this.cacheToken;
      return fetch(params).pipe(tap(data => {
        this.syncSession();
        if (revision !== this.cacheRevision || token !== this.cacheToken) return;
        this.views.delete(key(params));
        this.views.set(key(params), { data, savedAt: Date.now() });
        if (this.views.size > 20) this.views.delete(this.views.keys().next().value!);
      }));
    }), params => {
      this.syncSession();
      const saved = this.views.get(key(params));
      return saved && Date.now() - saved.savedAt < 300_000 ? saved.data as T : undefined;
    });
  }

  constructor(private http: HttpClient, private configuration: Configuration) {}
  private get<T>(path: string, filters: object = {}): Observable<T> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    }
    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
    return this.http.get<T>(`${this.configuration.basePath?.replace(/\/$/, '')}${path}`, { params, headers });
  }
  private write<T>(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown) {
    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
    return this.http.request<T>(method, `${this.configuration.basePath?.replace(/\/$/, '')}${path}`, { body, headers }).pipe(tap(() => this.clearViews()));
  }
  changePassword(currentPassword: string, newPassword: string) {
    return this.write<void>('POST', '/change-password', { currentPassword, newPassword });
  }
  profile() { return this.get<User>('/me'); }
  updateProfile(user: Pick<User, 'id' | 'username' | 'email'>) {
    return this.write<User>('PUT', '/updateUser', user);
  }
  myCatalogs() {
    return this.get<User>('/me').pipe(switchMap(user => {
      if (!user.id) throw new Error('Authenticated user is missing');
      return forkJoin({
        Category: this.get<CatalogItem[]>(`/getCategories/${user.id}`),
        Brand: this.get<CatalogItem[]>(`/getBrands/${user.id}`),
        Store: this.get<CatalogItem[]>(`/getStores/${user.id}`)
      }).pipe(map(data => ({
        Category: data.Category.filter(item => item.status?.id === 1),
        Brand: data.Brand.filter(item => item.status?.id === 1),
        Store: data.Store.filter(item => item.status?.id === 1)
      })));
    }));
  }
  saveCatalog(kind: CatalogKind, item: CatalogItem) {
    return this.write<CatalogItem>(item.id ? 'PUT' : 'POST', `/${item.id ? 'update' : 'create'}${kind}`, item);
  }
  deleteCatalog(kind: CatalogKind, id: number) { return this.write<void>('DELETE', `/delete${kind}/${id}`); }
  brands() { return this.get<Brand[]>('/getBrands'); }
  stores() { return this.get<Store[]>('/getStores'); }
  updateEntry(entry: AccountEntry) { return this.write<AccountEntry>('PUT', '/updateAccountEntry', entry); }
  deleteEntry(id: number) { return this.write<void>('DELETE', `/deleteAccountEntry/${id}`); }
  createEntry(entry: AccountEntry) { return this.write<AccountEntry>('POST', '/createAccountEntry', entry); }
  createWallet(wallet: Pick<Wallet, 'name' | 'comment'>) { return this.write<Wallet>('POST', '/wallets', wallet); }
  wallets() { return this.get<Wallet[]>('/wallets'); }
  categories() { return this.get<Category[]>('/getCategories'); }
  entries(filters: EntryFilters) { return this.get<EntryPage>('/account-entries', filters); }
  summary(from: string, to: string, walletId?: number) { return this.get<Summary>('/dashboard/summary', { from, to, walletId }); }
  monthly(from: string, to: string, walletId?: number) { return this.get<MonthlyTotals[]>('/dashboard/monthly', { from, to, walletId }); }
  byCategory(from: string, to: string, walletId?: number) { return this.get<CategoryTotals[]>('/dashboard/by-category', { from, to, walletId }); }
}
