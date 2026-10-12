import { Component } from '@angular/core';
import { AuthFrontService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  readonly menuItems = [
    { path: '/dashboard', label: 'Overview' },
    { path: '/transactions', label: 'Movements' },
    { path: '/wallets', label: 'Wallets' },
    { path: '/settings', label: 'Settings' }
  ];

  constructor(private auth: AuthFrontService, private router: Router) {}

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
