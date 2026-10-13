import { TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Observable } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { resource, CashBalanceService } from '../../core/cash-balance.service';
import { MonthlyChartComponent } from '../../shared/monthly-chart.component';

describe('DashboardComponent', () => {
  it('renders an empty annual overview without requesting a nonexistent wallet', async () => {
    const api = {
      view: (_name: string, trigger: Observable<any>, fetch: (params: any) => Observable<any>) => resource(trigger, fetch),
      wallets: jasmine.createSpy().and.returnValue(of([])),
      summary: jasmine.createSpy().and.returnValue(of({ balance: 0, income: 0, expenses: 0, net: 0, entryCount: 0 })),
      monthly: jasmine.createSpy().and.returnValue(of([])),
      byCategory: jasmine.createSpy().and.returnValue(of([]))
    };
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      imports: [CommonModule, RouterTestingModule, MonthlyChartComponent],
      providers: [{ provide: CashBalanceService, useValue: api }]
    }).compileComponents();
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Overview');
    expect(api.summary).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelectorAll('.wallet-card').length).toBe(0);
  });
});
