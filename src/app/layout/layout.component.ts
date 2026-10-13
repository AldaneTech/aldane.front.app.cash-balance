import { UnsavedChangesService } from '../shared/forms/unsaved-changes.service';
import { Component, ElementRef, HostListener, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CashBalanceService } from '../core/cash-balance.service';
import { I18nService } from '../i18n/i18n.service';
import { AuthFrontService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit, OnDestroy {
  private preferencesRequest?: Subscription;
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

  constructor(private auth: AuthFrontService, private router: Router, private api: CashBalanceService, private i18n: I18nService, private unsaved: UnsavedChangesService) {}

  ngOnInit() {
    this.preferencesRequest = this.api.preferences().subscribe({ next: preferences => this.i18n.setLanguage(preferences.language), error: () => {} });
  }

  ngOnDestroy() { this.preferencesRequest?.unsubscribe(); }

  async logout() {
    if (!await this.unsaved.canLeave()) return;
    this.profileMenuOpen = false;
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
