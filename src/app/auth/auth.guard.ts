import { Injectable } from '@angular/core';
import { CanActivate, CanActivateFn, Router } from '@angular/router';
import { AuthFrontService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthFrontService, private router: Router) {}

  canActivate(): boolean {
    if (this.auth.isLoggedIn()) return true;

    this.router.navigate(['/login']);
    return false;
  }
}
