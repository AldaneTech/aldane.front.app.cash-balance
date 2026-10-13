import { User } from '@aldanetech/cash-balance-api-client-angular';
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
  private profileRequest?: Subscription;
  private profileUpdates?: Subscription;
  user?: Pick<User, 'id' | 'username' | 'email'>;
  profileLoading = true;
  profileError = false;

  get initials() {
    const name = this.user?.username?.trim() ?? '';
    const words = name.split(/\s+/).filter(Boolean);
    return (words.length > 1 ? Array.from(words[0])[0] + Array.from(words[words.length - 1])[0] : Array.from(name).slice(0, 2).join('')).toLocaleUpperCase(this.i18n.locale);
  }

  loadProfile() {
    this.profileRequest?.unsubscribe();
    this.profileLoading = true;
    this.profileError = false;
    this.profileRequest = this.api.profile().subscribe({
      next: user => {
        if (!user?.id) { this.profileLoading = false; this.profileError = true; return; }
        this.setUser(user);
      },
      error: () => { this.profileLoading = false; this.profileError = true; }
    });
  }
  private setUser(user: User) {
    this.user = { id: user.id, username: user.username, email: user.email };
    this.profileLoading = false;
    this.profileError = false;
  }
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
    this.profileUpdates = this.api.profileUpdates$.subscribe(user => {
      this.profileRequest?.unsubscribe();
      this.setUser(user);
    });
    this.loadProfile();
    this.preferencesRequest = this.api.preferences().subscribe({ next: preferences => this.i18n.setLanguage(preferences.language), error: () => {} });
  }

  ngOnDestroy() {
    this.preferencesRequest?.unsubscribe();
    this.profileRequest?.unsubscribe();
    this.profileUpdates?.unsubscribe();
  }

  async logout() {
    if (!await this.unsaved.canLeave()) return;
    this.profileMenuOpen = false;
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
