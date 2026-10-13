import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { AuthFrontService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private auth: AuthFrontService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.auth.isLoggedIn()) return true;

    const hadSession = !!localStorage.getItem('auth_token');
    this.auth.logout();
    return this.router.createUrlTree(['/login'], hadSession ? { queryParams: { reason: 'session-expired' } } : {});
  }
  canActivateChild(): boolean | UrlTree { return this.canActivate(); }
}
