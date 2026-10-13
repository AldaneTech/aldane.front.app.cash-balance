import { of } from 'rxjs';
import { CashBalanceService } from '../core/cash-balance.service';
import { I18nModule } from '../i18n/i18n.module';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { LayoutComponent } from './layout.component';
import { SectionComponent } from '../pages/section/section.component';

@Component({ template: '<router-outlet></router-outlet>' })
class NavigationHostComponent {}

@Component({ template: '<h1>Dashboard</h1>' })
class DashboardStubComponent {}

describe('Main menu navigation', () => {
  it('keeps the same header and logo while navigating between child views', async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: CashBalanceService, useValue: { preferences: () => of({ language: 'en' }) } }],
      declarations: [NavigationHostComponent, LayoutComponent, DashboardStubComponent],
      imports: [I18nModule, RouterTestingModule.withRoutes([
        { path: '', component: LayoutComponent, children: [
          { path: 'dashboard', component: DashboardStubComponent },
          { path: 'analytics', component: SectionComponent, data: { title: 'Analytics' } },
          { path: 'transactions', component: SectionComponent, data: { title: 'Transactions' } },
          { path: 'settings', component: SectionComponent, data: { title: 'Settings' } },
          { path: 'wallets', component: SectionComponent, data: { title: 'Wallets' } }
        ] }
      ])]
    }).compileComponents();
    const fixture = TestBed.createComponent(NavigationHostComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();
    await router.navigateByUrl('/dashboard');
    fixture.detectChanges();
    await fixture.whenStable();
    const header = fixture.nativeElement.querySelector('header');
    const logo = header.querySelector('img');

    for (const path of ['transactions', 'wallets', 'settings', 'dashboard']) {
      const link = header.querySelector(`a[routerLinkActive][href="/${path}"]`) as HTMLAnchorElement;
      link.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(router.url).toBe(`/${path}`);
      expect(fixture.nativeElement.querySelector('header')).toBe(header);
      expect(fixture.nativeElement.querySelector('header img')).toBe(logo);
      expect(link.getAttribute('aria-current')).toBe('page');
    }
  });
});
