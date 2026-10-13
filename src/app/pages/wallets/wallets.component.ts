import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { combineLatest, BehaviorSubject, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { Wallet } from '@aldanetech/cash-balance-api-client-angular';
import { CashBalanceService, yearToDate } from '../../core/cash-balance.service';
import { MonthlyChartComponent } from '../../shared/monthly-chart.component';
import { MovementTableComponent } from '../../shared/movement-table.component';

@Component({ selector: 'app-wallets', standalone: true, imports: [CommonModule, FormsModule, RouterModule, MonthlyChartComponent, MovementTableComponent], templateUrl: './wallets.component.html', styleUrl: './wallets.component.scss' })
export class WalletsComponent {
  readonly period = yearToDate();
  private refresh = new BehaviorSubject<void>(undefined);
  readonly view$;
  constructor(private api: CashBalanceService, route: ActivatedRoute, private router: Router) {
    this.view$ = this.api.view('wallets', combineLatest([route.paramMap.pipe(map(params => params.get('walletId'))), this.refresh]), ([params]) => {
      const walletId = params !== null ? Number(params) : undefined;
      const { from, to } = this.period;
      return forkJoin({ wallets: api.wallets(), summary: api.summary(from, to, walletId), monthly: api.monthly(from, to, walletId), latest: api.entries({ walletId, size: 5, sortBy: 'date', direction: 'desc' }) })
        .pipe(map(data => ({ ...data, wallets: data.wallets.filter(w => w.status?.id === 1), selected: data.wallets.find(w => w.id === walletId), walletId })));
    });
  }
  @ViewChild('createDialog', { static: true }) createDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('walletForm') walletForm?: NgForm;
  editing?: Wallet;
  archiving = false;
  creating = false;
  createError = '';
  successMessage = '';
  draft = { name: '', comment: '' };

  openCreate() {
    if (this.creating) return;
    this.editing = undefined;
    this.archiving = false;
    this.draft = { name: '', comment: '' };
    this.walletForm?.resetForm(this.draft);
    this.createError = '';
    this.successMessage = '';
    this.createDialog.nativeElement.showModal();
  }
  openEdit(wallet: Wallet, archiving = false) {
    if (this.creating || !wallet.id) return;
    this.editing = wallet;
    this.archiving = archiving;
    this.draft = { name: wallet.name ?? '', comment: wallet.comment ?? '' };
    this.walletForm?.resetForm(this.draft);
    this.createError = this.successMessage = '';
    this.createDialog.nativeElement.showModal();
  }
  closeCreate() {
    if (!this.creating) this.createDialog.nativeElement.close();
  }
  cancelCreate(event: Event) {
    event.preventDefault();
    this.closeCreate();
  }
  @HostListener('window:beforeunload', ['$event'])
  preventUnload(event: BeforeUnloadEvent) {
    if (this.creating) { event.preventDefault(); event.returnValue = ''; }
  }
  createWallet() {
    if (this.creating) return;
    if (this.archiving && this.editing?.id) {
      this.creating = true;
      this.createError = '';
      this.api.archiveWallet(this.editing.id).subscribe({
        next: () => {
          this.creating = false;
          this.closeCreate();
          this.successMessage = 'Wallet archived. Its movements are preserved but excluded from active-wallet views and totals.';
          this.router.navigate(['/wallets']).then(() => this.reload());
        },
        error: () => this.creationFailed()
      });
      return;
    }
    if (!this.draft.name.trim()) return;
    this.creating = true;
    this.createError = '';
    const payload = { name: this.draft.name.trim(), comment: this.draft.comment.trim() };
    (this.editing ? this.api.updateWallet({ id: this.editing.id, ...payload }) : this.api.createWallet(payload)).subscribe({
      next: wallet => {
        if (!wallet?.id) { this.creationFailed(); return; }
        this.creating = false;
        this.closeCreate();
        this.successMessage = this.editing ? 'Wallet updated successfully.' : 'Wallet created successfully.';
        this.reload();
      },
      error: () => this.creationFailed()
    });
  }
  private creationFailed() {
    this.creating = false;
    this.createError = `We could not ${this.archiving ? 'archive' : this.editing ? 'update' : 'create'} your wallet. Please try again.`;
  }
  trackWallet(_: number, wallet: { id?: number }) { return wallet.id; }
  reload() { this.refresh.next(); }
}
