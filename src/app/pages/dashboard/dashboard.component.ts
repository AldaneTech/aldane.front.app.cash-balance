import { Component } from '@angular/core';
import { BehaviorSubject, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CashBalanceService, resource, yearToDate } from '../../core/cash-balance.service';

@Component({ selector: 'app-dashboard', templateUrl: './dashboard.component.html', styleUrl: './dashboard.component.scss' })
export class DashboardComponent {
  readonly period = yearToDate();
  private refresh = new BehaviorSubject<void>(undefined);
  readonly view$;
  constructor(private api: CashBalanceService) {
    const { from, to } = this.period;
    this.view$ = resource(this.refresh, () => forkJoin({
      wallets: this.api.wallets(), summary: this.api.summary(from, to), monthly: this.api.monthly(from, to), categories: this.api.byCategory(from, to)
    }).pipe(switchMap(data => {
      const wallets = data.wallets.filter(w => w.status?.id === 1);
      return (wallets.length ? forkJoin(wallets.map(wallet => this.api.summary(from, to, wallet.id).pipe(map(summary => ({ wallet, summary }))))) : of([]))
        .pipe(map(walletSummaries => ({ ...data, walletSummaries, categories: data.categories.filter(c => Number(c.expenses) > 0).sort((a,b) => Number(b.expenses) - Number(a.expenses)) })));
    })));
  }
  reload() { this.refresh.next(); }
  categoryShare(expenses: number, total: number) { return total > 0 ? Number(expenses) / Number(total) * 100 : 0; }
}
