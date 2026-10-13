import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Wallet, Category, Store, Brand, AccountEntry } from '@aldanetech/cash-balance-api-client-angular';
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
  @Output() updated = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  @ViewChild('dialog', { static: true }) dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('form') form?: NgForm;
  editing?: AccountEntry;
  deleting = false;
  busy = false;
  error = '';
  draft = this.emptyDraft();
  constructor(private api: CashBalanceService) {}
  private emptyDraft(walletId?: number) {
    return { walletId, typeId: 2, amount: null as number | null, date: yearToDate().to, comment: '', categoryId: undefined as number | undefined, storeId: undefined as number | undefined, brandId: undefined as number | undefined };
  }
  open(walletId?: number) {
    if (this.busy) return;
    this.editing = undefined;
    this.deleting = false;
    this.draft = this.emptyDraft(this.wallets.some(w => w.id === walletId) ? walletId : this.wallets[0]?.id);
    this.resetFormWithDraft();
    this.error = '';
    this.dialog.nativeElement.showModal();
  }
  openEdit(entry: AccountEntry, deleting = false) {
    if (this.busy || !entry.id) return;
    this.editing = entry;
    this.deleting = deleting;
    this.draft = {
      walletId: entry.wallet?.id, typeId: entry.type_operation?.id ?? (Number(entry.amount) < 0 ? 2 : 1),
      amount: Math.abs(Number(entry.amount)), date: entry.date?.slice(0, 10) ?? '', comment: entry.comment ?? '',
      categoryId: entry.category?.id, storeId: entry.store?.id, brandId: entry.brand?.id
    };
    this.resetFormWithDraft();
    this.error = '';
    this.dialog.nativeElement.showModal();
  }
  private resetFormWithDraft() {
    // NgForm resets ngModel asynchronously: reset to the new values rather than null.
    this.form?.resetForm({
      wallet: this.draft.walletId, type: this.draft.typeId, amount: this.draft.amount,
      date: this.draft.date, comment: this.draft.comment, category: this.draft.categoryId,
      store: this.draft.storeId, brand: this.draft.brandId
    });
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
    if (this.deleting && this.editing?.id) {
      this.error = '';
      this.setBusy(true);
      this.api.deleteEntry(this.editing.id).subscribe({
        next: () => { this.setBusy(false); this.close(); this.deleted.emit(); },
        error: () => this.failed()
      });
      return;
    }
    const amount = Number(this.draft.amount);
    if (!this.draft.walletId || !this.draft.date || !Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) {
      this.error = 'Choose a wallet, a date and an amount greater than zero with up to two decimal places.'; return;
    }
    this.error = '';
    this.setBusy(true);
    const payload: AccountEntry = {
      ...(this.editing ? { id: this.editing.id } : {}),
      wallet: { id: this.draft.walletId }, type_operation: { id: this.draft.typeId },
      amount: this.editing && this.draft.typeId !== 1 && this.draft.typeId !== 2 && Number(this.editing.amount) < 0 ? -amount : amount,
      date: this.draft.date, comment: this.draft.comment.trim(),
      ...(this.draft.categoryId ? { category: { id: this.draft.categoryId } } : {}),
      ...(this.draft.storeId ? { store: { id: this.draft.storeId } } : {}),
      ...(this.draft.brandId ? { brand: { id: this.draft.brandId } } : {})
    };
    (this.editing ? this.api.updateEntry(payload) : this.api.createEntry(payload)).subscribe({
      next: entry => {
        if (!entry?.id) { this.failed(); return; }
        this.setBusy(false); this.close(); (this.editing ? this.updated : this.created).emit();
      },
      error: () => this.failed()
    });
  }
  private failed() { this.setBusy(false); this.error = `We could not ${this.deleting ? 'delete' : this.editing ? 'update' : 'create'} your movement. Please try again.`; }
}
