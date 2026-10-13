import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { AuthFrontService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  profileMenuOpen = false;
  @ViewChild('profileMenu') profileMenu?: ElementRef<HTMLElement>;
  @ViewChild('profileTrigger') profileTrigger?: ElementRef<HTMLButtonElement>;

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent) {
    if (!this.profileMenu?.nativeElement.contains(event.target as Node)) this.profileMenuOpen = false;
  }

  @HostListener('document:keydown.escape')
  closeOnEscape() {
    if (this.profileMenuOpen) {
      this.profileMenuOpen = false;
      this.profileTrigger?.nativeElement.focus();
    }
  }

  closeOnFocusOut(event: FocusEvent) {
    if (!this.profileMenu?.nativeElement.contains(event.relatedTarget as Node)) this.profileMenuOpen = false;
  }

  readonly menuItems = [
    { path: '/dashboard', label: 'Overview' },
    { path: '/transactions', label: 'Movements' },
    { path: '/wallets', label: 'Wallets' },
    { path: '/settings', label: 'Settings' }
  ];

  constructor(private auth: AuthFrontService, private router: Router) {}

  logout() {
    this.profileMenuOpen = false;
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
