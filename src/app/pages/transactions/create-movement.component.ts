import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Wallet, Category, Store, Brand } from '@aldanetech/cash-balance-api-client-angular';
import { CashBalanceService, yearToDate } from '../../core/cash-balance.service';

@Component({
  selector: 'app-create-movement', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './create-movement.component.html',
  styleUrls: ['../wallets/wallets.component.scss', './create-movement.component.scss']
})
export class CreateMovementComponent {
  @Input() wallets: Wallet[] = [];
  @Input() categories: Category[] = [];
  @Input() stores: Store[] = [];
  @Input() brands: Brand[] = [];
  @Output() busyChange = new EventEmitter<boolean>();
  @Output() created = new EventEmitter<void>();
  @ViewChild('dialog', { static: true }) dialog!: ElementRef<HTMLDialogElement>;
  busy = false;
  error = '';
  draft = this.emptyDraft();
  constructor(private api: CashBalanceService) {}
  private emptyDraft(walletId?: number) {
    return { walletId, typeId: 2, amount: null as number | null, date: yearToDate().to, comment: '', categoryId: undefined as number | undefined, storeId: undefined as number | undefined, brandId: undefined as number | undefined };
  }
  open(walletId?: number) {
    this.draft = this.emptyDraft(this.wallets.some(w => w.id === walletId) ? walletId : this.wallets[0]?.id);
    this.error = '';
    this.dialog.nativeElement.showModal();
  }
  close() { if (!this.busy) this.dialog.nativeElement.close(); }
  cancel(event: Event) { event.preventDefault(); this.close(); }
  @HostListener('window:beforeunload', ['$event'])
  preventUnload(event: BeforeUnloadEvent) {
    if (this.busy) { event.preventDefault(); event.returnValue = ''; }
  }
  private setBusy(value: boolean) { this.busy = value; this.busyChange.emit(value); }
  save() {
    if (this.busy) return;
    const amount = Number(this.draft.amount);
    if (!this.draft.walletId || !this.draft.date || !Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) {
      this.error = 'Choose a wallet, a date and an amount greater than zero with up to two decimal places.'; return;
    }
    this.error = '';
    this.setBusy(true);
    this.api.createEntry({
      wallet: { id: this.draft.walletId }, type_operation: { id: this.draft.typeId }, amount,
      date: this.draft.date, comment: this.draft.comment.trim(),
      ...(this.draft.categoryId ? { category: { id: this.draft.categoryId } } : {}),
      ...(this.draft.storeId ? { store: { id: this.draft.storeId } } : {}),
      ...(this.draft.brandId ? { brand: { id: this.draft.brandId } } : {})
    }).subscribe({
      next: entry => {
        if (!entry?.id) { this.failed(); return; }
        this.setBusy(false); this.close(); this.created.emit();
      },
      error: () => this.failed()
    });
  }
  private failed() { this.setBusy(false); this.error = 'We could not create your movement. Please try again.'; }
}
