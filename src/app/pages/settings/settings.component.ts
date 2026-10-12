import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { CashBalanceService, CatalogItem, CatalogKind, resource } from '../../core/cash-balance.service';

@Component({
  selector: 'app-settings', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html', styleUrls: ['../wallets/wallets.component.scss', './settings.component.scss']
})
export class SettingsComponent {
  readonly tabs: { kind: CatalogKind; label: string; singular: string; description: string }[] = [
    { kind: 'Category', label: 'Categories', singular: 'category', description: 'Group your income and expenses by purpose.' },
    { kind: 'Brand', label: 'Brands', singular: 'brand', description: 'Keep track of the brands in your movements.' },
    { kind: 'Store', label: 'Stores', singular: 'store', description: 'Organize the places where you spend.' }
  ];
  selected = this.tabs[0];
  search = '';
  private refresh = new BehaviorSubject<void>(undefined);
  readonly view$ = resource(this.refresh, () => this.api.myCatalogs());
  @ViewChild('editor', { static: true }) editor!: ElementRef<HTMLDialogElement>;
  creating = false;
  error = '';
  success = '';
  deleting = false;
  draft: CatalogItem = {};
  operationKind: CatalogKind = 'Category';
  operationLabel = 'category';
  constructor(private api: CashBalanceService) {}
  select(tab: typeof this.tabs[number]) { this.selected = tab; this.search = ''; this.success = ''; }
  visible(items: CatalogItem[]) {
    const query = this.search.trim().toLowerCase();
    return items.filter(item => `${item.name || ''} ${item.comment || ''}`.toLowerCase().includes(query));
  }
  trackItem(_: number, item: CatalogItem) { return item.id; }
  open(item?: CatalogItem, deleting = false) {
    this.operationKind = this.selected.kind; this.operationLabel = this.selected.singular;
    this.draft = item ? { id: item.id, name: item.name, comment: item.comment } : { name: '', comment: '' };
    this.deleting = deleting; this.error = ''; this.success = '';
    this.editor.nativeElement.showModal();
  }
  close() { if (!this.creating) this.editor.nativeElement.close(); }
  cancel(event: Event) { event.preventDefault(); this.close(); }
  @HostListener('window:beforeunload', ['$event'])
  preventUnload(event: BeforeUnloadEvent) { if (this.creating) { event.preventDefault(); event.returnValue = ''; } }
  submit() {
    if (this.creating || (!this.deleting && !this.draft.name?.trim())) return;
    this.creating = true; this.error = '';
    if (this.deleting) {
      this.api.deleteCatalog(this.operationKind, this.draft.id!).subscribe({ next: () => this.completed('removed'), error: () => this.failed() });
    } else {
      this.api.saveCatalog(this.operationKind, { ...this.draft, name: this.draft.name!.trim(), comment: this.draft.comment?.trim() || '' }).subscribe({
        next: item => item?.id ? this.completed(this.draft.id ? 'updated' : 'created') : this.failed(), error: () => this.failed()
      });
    }
  }
  private completed(action: string) {
    this.creating = false; this.close(); this.success = `${this.operationKind} ${action} successfully.`; this.reload();
  }
  private failed() { this.creating = false; this.error = 'We could not save your changes. Please try again.'; }
  reload() { this.refresh.next(); }
}
