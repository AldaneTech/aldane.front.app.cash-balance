import { I18nModule } from '../i18n/i18n.module';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import { MonthlyTotals, yearToDate } from '../core/cash-balance.service';

@Component({
  selector: 'app-monthly-chart', standalone: true, imports: [I18nModule, CommonModule],
  template: `
    <div class="chart-legend"><span *ngIf="mode === 'line'"><i class="income-dot"></i>{{ 'Income' | t }}</span><span><i class="expense-dot"></i>{{ 'Expenses' | t }}</span></div>
    <div class="chart-scroll">
      <svg viewBox="0 0 780 270" role="img" [attr.aria-label]="('Monthly income and expenses for ' | t) + year">
        <g *ngFor="let tick of ticks">
          <line x1="62" x2="754" [attr.y1]="tick.y" [attr.y2]="tick.y" stroke="#edf0eb" />
          <text x="50" [attr.y]="tick.y + 4" text-anchor="end" class="axis-label">{{ tick.value | localNumber }}</text>
        </g>
        <ng-container *ngIf="mode === 'line'">
          <path [attr.d]="areaPath" fill="#2e7d32" opacity="0.07" />
          <polyline [attr.points]="points('income')" fill="none" stroke="#2e7d32" stroke-width="3" stroke-linejoin="round" />
          <polyline [attr.points]="points('expenses')" fill="none" stroke="#b87656" stroke-width="3" stroke-linejoin="round" />
        </ng-container>
        <g *ngFor="let month of months; let i = index">
          <ng-container *ngIf="mode === 'bar'">
            <rect [attr.x]="x(i) - 10" [attr.y]="y(month.expenses)" width="20" [attr.height]="220 - y(month.expenses)" rx="4" fill="#b87656"><title>{{ month.label }}: {{ month.expenses | money }}</title></rect>
          </ng-container>
          <ng-container *ngIf="mode === 'line'">
            <circle [attr.cx]="x(i)" [attr.cy]="y(month.income)" r="4" fill="#2e7d32"><title>{{ month.label }} {{ 'income' | t }}: {{ month.income | money }}</title></circle>
            <circle [attr.cx]="x(i)" [attr.cy]="y(month.expenses)" r="4" fill="#b87656"><title>{{ month.label }} {{ 'expenses' | t }}: {{ month.expenses | money }}</title></circle>
          </ng-container>
          <text [attr.x]="x(i)" y="253" text-anchor="middle" class="axis-label">{{ month.label }}</text>
        </g>
      </svg>
    </div>
    <p *ngIf="!hasActivity" class="chart-empty">{{ 'No movements recorded in this period.' | t }}</p>
  `,
  styles: [`:host{display:block}.chart-legend{display:flex;gap:22px;color:#7b827a;font-size:12px;margin:12px 0 20px}.chart-legend span{display:flex;align-items:center;gap:7px}i{width:8px;height:8px;border-radius:50%}.income-dot{background:#2e7d32}.expense-dot{background:#b87656}.chart-scroll{overflow-x:auto}svg{width:100%;min-width:440px;display:block}.axis-label{fill:#8a9189;font-size:12px}.chart-empty{color:#8a9189;font-size:13px;text-align:center;margin:4px 0}`]
})
export class MonthlyChartComponent {
  constructor(private i18n: I18nService) {}
  @Input() data: MonthlyTotals[] = [];
  @Input() mode: 'line' | 'bar' = 'line';
  @Input() year = yearToDate().year;
  @Input() monthCount = yearToDate().monthCount;
  get months() {
    return Array.from({ length: this.monthCount }, (_, i) => {
      const row = this.data.find(item => item.month === `${this.year}-${String(i + 1).padStart(2, '0')}`);
      return { label: new Date(Date.UTC(this.year, i, 1)).toLocaleString(this.i18n.locale, { month: 'short', timeZone: 'UTC' }), income: Number(row?.income ?? 0), expenses: Number(row?.expenses ?? 0) };
    });
  }
  get max() { return Math.max(1, ...this.months.map(m => this.mode === 'bar' ? m.expenses : Math.max(m.income, m.expenses))) * 1.15; }
  get ticks() { return [0, 1, 2, 3, 4].map(i => ({ value: this.max * i / 4, y: this.y(this.max * i / 4) })); }
  get hasActivity() { return this.months.some(m => m.income !== 0 || m.expenses !== 0); }
  x(i: number) { return 80 + i * (650 / Math.max(this.monthCount - 1, 1)); }
  y(value: number) { return 220 - value / this.max * 200; }
  points(key: 'income' | 'expenses') { return this.months.map((m, i) => `${this.x(i)},${this.y(m[key])}`).join(' '); }
  get areaPath() { return `M ${this.x(0)},220 L ${this.months.map((m, i) => `${this.x(i)},${this.y(m.income)}`).join(' L ')} L ${this.x(this.monthCount - 1)},220 Z`; }
}
