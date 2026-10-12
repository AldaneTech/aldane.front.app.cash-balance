import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Subject, of } from 'rxjs';
import { CashBalanceService, Summary } from '../../core/cash-balance.service';
import { walletRouteMatcher } from '../../app-routing.module';
import { WalletsComponent } from './wallets.component';

@Component({ template: '<router-outlet></router-outlet>' })
class WalletNavigationHost {}

describe('Wallet navigation', () => {
  it('keeps the cards and chart mounted while loading a different wallet and returning to all wallets', async () => {
    const totals: Summary = { balance: 100, income: 100, expenses: 0, net: 100, entryCount: 1 };
    const pending = new Subject<Summary>();
    const wallets = [{ id: 1, name: 'Daily', budget: 100, status: { id: 1 } }, { id: 2, name: 'Savings', budget: 0, status: { id: 1 } }];
    const api = {
      wallets: () => of(wallets.map(wallet => ({ ...wallet }))),
      summary: (_from: string, _to: string, id?: number) => id === 1 ? pending : of(totals),
      monthly: () => of([]), entries: () => of({ items: [] })
    };
    await TestBed.configureTestingModule({
      declarations: [WalletNavigationHost],
      imports: [RouterTestingModule.withRoutes([{ matcher: walletRouteMatcher, component: WalletsComponent }])],
      providers: [{ provide: CashBalanceService, useValue: api }]
    }).compileComponents();
    const fixture = TestBed.createComponent(WalletNavigationHost);
    const router = TestBed.inject(Router);
    fixture.detectChanges();
    await router.navigateByUrl('/wallets'); fixture.detectChanges();
    const root = fixture.nativeElement;
    const view = root.querySelector('app-wallets');
    const chart = root.querySelector('app-monthly-chart');
    const card = root.querySelector('a[href="/wallets/1"]');
    await router.navigateByUrl('/wallets/1'); fixture.detectChanges();
    expect(root.querySelector('app-wallets')).toBe(view);
    expect(root.querySelector('app-monthly-chart')).toBe(chart);
    expect(root.querySelector('a[href="/wallets/1"]')).toBe(card);
    pending.next({ ...totals, balance: 42 }); pending.complete(); fixture.detectChanges();
    expect(root.querySelector('a[href="/wallets/1"]')).toBe(card);
    expect(card.classList.contains('selected-wallet')).toBeTrue();
    await router.navigateByUrl('/wallets/2'); fixture.detectChanges();
    await router.navigateByUrl('/wallets'); fixture.detectChanges();
    expect(root.querySelector('app-wallets')).toBe(view);
    expect(root.querySelector('app-monthly-chart')).toBe(chart);
    expect(root.querySelector('.all-wallets').classList.contains('selected-wallet')).toBeTrue();
  });
});
