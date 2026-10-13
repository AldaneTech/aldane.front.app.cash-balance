import { I18nModule } from '../../i18n/i18n.module';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { CashBalanceService, EntryFilters, yearToDate } from '../../core/cash-balance.service';
import { CreateMovementComponent } from './create-movement.component';
import { MovementTableComponent } from '../../shared/movement-table.component';

@Component({ selector: 'app-transactions', standalone: true, imports: [I18nModule, CommonModule, FormsModule, MovementTableComponent, CreateMovementComponent], templateUrl: './transactions.component.html', styleUrl: './transactions.component.scss' })
export class TransactionsComponent {
  readonly period = yearToDate();
  filters: EntryFilters = { from: this.period.from, to: this.period.to, page: 0, size: 10, sortBy: 'date', direction: 'desc' };
  private selection = new BehaviorSubject<EntryFilters>({ ...this.filters });
  readonly view$;
  dateError = '';
  creating = false;
  successMessage = '';
  movementCreated() { this.successMessage = 'Movement created successfully. Your wallet balance has been updated.'; this.filters.page = 0; this.reload(); }
  movementChanged(deleted = false) {
    this.successMessage = deleted ? 'Movement deleted. Your wallet balance has been updated.' : 'Movement updated. Your wallet balance has been updated.';
    this.filters.page = 0;
    this.reload();
  }
  constructor(api: CashBalanceService, route: ActivatedRoute) {
    const walletId = Number(route.snapshot.queryParamMap.get('walletId'));
    if (Number.isSafeInteger(walletId) && walletId > 0) { this.filters.walletId = walletId; this.selection.next({ ...this.filters }); }
    this.view$ = api.view('movements', this.selection, filters => forkJoin({ entries: api.entries(filters), wallets: api.wallets(), categories: api.categories(), brands: api.brands(), stores: api.stores() }).pipe(map(data => ({ ...data, wallets: data.wallets.filter(w => w.status?.id === 1), filters }))));
  }
  apply() {
    if (this.filters.from && this.filters.to && this.filters.from > this.filters.to) { this.dateError = 'The start date must be before the end date.'; return; }
    this.dateError = ''; this.filters.page = 0; this.selection.next({ ...this.filters });
  }
  reset() { this.filters = { from: this.period.from, to: this.period.to, page: 0, size: 10, sortBy: 'date', direction: 'desc' }; this.apply(); }
  reload() { this.selection.next({ ...this.filters }); }
  page(page: number) { this.filters.page = page; this.reload(); }
  sort(sortBy: 'date' | 'amount') { this.filters.direction = this.filters.sortBy === sortBy && this.filters.direction === 'desc' ? 'asc' : 'desc'; this.filters.sortBy = sortBy; this.apply(); }
}
