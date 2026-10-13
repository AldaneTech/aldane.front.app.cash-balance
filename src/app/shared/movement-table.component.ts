import { I18nModule } from '../i18n/i18n.module';
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AccountEntry } from '@aldanetech/cash-balance-api-client-angular';

@Component({
  selector: 'app-movement-table', standalone: true, imports: [I18nModule, CommonModule],
  template: `
    <div class="table-scroll">
      <table>
        <thead><tr><th>{{ 'Movement' | t }}</th><th *ngIf="!compact">{{ 'Wallet' | t }}</th><th>{{ 'Category' | t }}</th><th>{{ 'Type' | t }}</th>
          <th [attr.aria-sort]="sortBy === 'date' ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'"><button type="button" [disabled]="compact" (click)="sort.emit('date')">{{ 'Date' | t }} {{ sortBy === 'date' ? (direction === 'asc' ? '↑' : '↓') : '' }}</button></th>
          <th class="amount" [attr.aria-sort]="sortBy === 'amount' ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'"><button type="button" [disabled]="compact" (click)="sort.emit('amount')">{{ 'Amount' | t }} {{ sortBy === 'amount' ? (direction === 'asc' ? '↑' : '↓') : '' }}</button></th>
        <th *ngIf="editable">{{ 'Actions' | t }}</th></tr></thead>
        <tbody><tr *ngFor="let entry of entries; trackBy: trackEntry">
          <td><div class="movement-name"><span class="movement-icon" [class.expense]="amount(entry) < 0">{{ amount(entry) < 0 ? '↗' : '↙' }}</span><div><strong>{{ entry.comment || entry.store?.name || ('Movement #' | t) + entry.id }}</strong><small>{{ subtitle(entry) }}</small></div></div></td>
          <td *ngIf="!compact">{{ entry.wallet?.name || '—' }}</td><td>{{ entry.category?.name || ('Uncategorized' | t) }}</td>
          <td><span class="type-badge" [class.expense]="amount(entry) < 0">{{ entry.type_operation?.id === 1 ? ('Income' | t) : entry.type_operation?.id === 2 ? ('Expense' | t) : entry.type_operation?.name || (amount(entry) < 0 ? ('Expense' | t) : ('Income' | t)) }}</span></td>
          <td class="date">{{ entry.date ? (entry.date | localDate) : '—' }}</td>
          <td class="amount" [class.negative]="amount(entry) < 0" [class.positive]="amount(entry) > 0">{{ amount(entry) > 0 ? '+' : '' }}{{ amount(entry) | money }}</td>
        <td *ngIf="editable"><button type="button" (click)="edit.emit(entry)" [disabled]="busy" [attr.aria-label]="'Edit movement {id}' | t:{ id: entry.id }">{{ 'Edit' | t }}</button> · <button type="button" (click)="remove.emit(entry)" [disabled]="busy" [attr.aria-label]="'Delete movement {id}' | t:{ id: entry.id }">{{ 'Delete' | t }}</button></td>
        </tr><tr *ngIf="!entries.length"><td [attr.colspan]="(compact ? 5 : 6) + (editable ? 1 : 0)" class="empty-table">{{ 'No movements match this selection.' | t }}</td></tr></tbody>
      </table>
    </div>
  `,
  styles: [`:host{display:block}.table-scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:13px;white-space:nowrap}th{text-align:left;font-weight:500;background:#f7f8f5;color:#858b83;padding:17px 16px}th:first-child{border-radius:10px 0 0 10px}th:last-child{border-radius:0 10px 10px 0}td{padding:20px 16px;border-bottom:1px solid #f0f1ed;color:#70786d}tbody tr:last-child td{border-bottom:0}strong{display:block;color:#283126;font-weight:600;max-width:260px;overflow:hidden;text-overflow:ellipsis}small{display:block;font-size:11px;color:#91978c;margin-top:4px}.movement-name{display:flex;align-items:center;gap:12px}.movement-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:#eef6ed;color:#2e7d32;font-size:19px;flex-shrink:0}.movement-icon.expense{background:#fbefe9;color:#ad7054}.type-badge{background:#edf6ee;color:#2e7d32;padding:6px 10px;border-radius:6px;font-size:11px}.type-badge.expense{background:#fbefe9;color:#ad7054}.amount{text-align:right;font-variant-numeric:tabular-nums}.positive{color:#2e7d32;font-weight:600}.negative{color:#ad7054;font-weight:600}.empty-table{text-align:center;padding:48px}.date{font-size:12px}button{cursor:pointer}`]
})
export class MovementTableComponent {
  @Input() entries: AccountEntry[] = [];
  @Input() compact = false;
  @Input() editable = false;
  @Input() busy = false;
  @Output() edit = new EventEmitter<AccountEntry>();
  @Output() remove = new EventEmitter<AccountEntry>();
  @Input() sortBy = 'date';
  @Input() direction = 'desc';
  @Output() sort = new EventEmitter<'date' | 'amount'>();
  amount(entry: AccountEntry) { return Number(entry.amount ?? 0); }
  subtitle(entry: AccountEntry) { return [entry.store?.name, entry.brand?.name].filter(Boolean).join(' · ') || `#${entry.id}`; }
  trackEntry(_: number, entry: AccountEntry) { return entry.id; }
}
