import { NgModule } from '@angular/core';
import { RouterModule, Routes, UrlSegment, UrlMatchResult } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';
import { WalletsComponent } from './pages/wallets/wallets.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AuthGuard } from './auth/auth.guard';

// Use one route configuration for the list and detail so Angular reuses the view.
export function walletRouteMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments[0]?.path !== 'wallets' || segments.length > 2) return null;
  return { consumed: segments, posParams: segments[1] ? { walletId: segments[1] } : {} };
}

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'profile', component: ProfileComponent },
      { path: 'settings', component: SettingsComponent, canDeactivate: [(component: SettingsComponent) => !component.creating] },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'analytics', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'transactions', component: TransactionsComponent, canDeactivate: [(component: TransactionsComponent) => !component.creating] },
      { matcher: walletRouteMatcher, component: WalletsComponent, canDeactivate: [(component: WalletsComponent) => !component.creating] },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
