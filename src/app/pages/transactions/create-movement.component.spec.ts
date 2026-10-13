import { I18nService } from '../../i18n/i18n.service';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AccountEntry } from '@aldanetech/cash-balance-api-client-angular';
import { CashBalanceService } from '../../core/cash-balance.service';
import { CreateMovementComponent } from './create-movement.component';

describe('CreateMovementComponent', () => {
  async function setup() {
    const response = new Subject<AccountEntry>();
    const api = { createEntry: jasmine.createSpy().and.returnValue(response), updateEntry: jasmine.createSpy().and.returnValue(response), deleteEntry: jasmine.createSpy().and.returnValue(response) };
    await TestBed.configureTestingModule({ imports: [CreateMovementComponent], providers: [{ provide: CashBalanceService, useValue: api }] }).compileComponents();
    const fixture = TestBed.createComponent(CreateMovementComponent);
    TestBed.inject(I18nService).setLanguage('en');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.wallets = [{ id: 7, name: 'Daily' }];
    const dialog = component.dialog.nativeElement;
    spyOn(dialog, 'showModal'); spyOn(dialog, 'close');
    component.open(7);
    component.draft.amount = 12.34;
    component.draft.comment = ' Lunch ';
    return { fixture, component, dialog, response, api };
  }
  it('sends expense type and a positive amount, locks the form and closes only on success', async () => {
    const { fixture, component, dialog, response, api } = await setup();
    const created = spyOn(component.created, 'emit');
    component.save();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('fieldset').disabled).toBeTrue();
    component.cancel(new Event('cancel')); component.save();
    expect(dialog.close).not.toHaveBeenCalled();
    expect(api.createEntry).toHaveBeenCalledTimes(1);
    expect(api.createEntry.calls.mostRecent().args[0]).toEqual({ wallet: { id: 7 }, type_operation: { id: 2 }, amount: 12.34, date: component.draft.date, comment: 'Lunch' });
    response.next({ id: 10 });
    expect(component.busy).toBeFalse(); expect(dialog.close).toHaveBeenCalled(); expect(created).toHaveBeenCalled();
  });
  it('keeps the form open and restores interaction when the request fails', async () => {
    const { component, dialog, response } = await setup();
    component.save(); response.error(new Error('Server error'));
    expect(component.busy).toBeFalse(); expect(dialog.close).not.toHaveBeenCalled();
    expect(component.draft.amount).toBe(12.34); expect(component.error).toContain('try again');
  });
  it('rejects amounts with more than two decimal places without sending a request', async () => {
    const { component, api } = await setup();
    component.draft.amount = 1.234; component.save();
    expect(api.createEntry).not.toHaveBeenCalled(); expect(component.error).toContain('two decimal');
  });
  it('prefills expenses as positive amounts and updates the existing ID without creating a duplicate', async () => {
    const { component, api, response } = await setup();
    const updated = spyOn(component.updated, 'emit');
    const original: AccountEntry = { id: 10, wallet: { id: 7 }, amount: -20, date: '2026-10-01', category: { id: 2 }, type_operation: { id: 2 }, comment: 'Original' };
    component.openEdit(original);
    expect(component.draft.amount).toBe(20);
    expect(component.draft.categoryId).toBe(2);
    component.draft.amount = 25;
    component.draft.categoryId = undefined;
    component.save(); component.save();
    expect(api.updateEntry).toHaveBeenCalledTimes(1);
    const payload = api.updateEntry.calls.mostRecent().args[0];
    expect(payload.id).toBe(10); expect(payload.amount).toBe(25);
    expect(payload.wallet.id).toBe(7); expect(payload.category).toBeUndefined();
    expect(api.createEntry).not.toHaveBeenCalled();
    expect(original.amount).toBe(-20);
    response.next({ id: 10 }); expect(updated).toHaveBeenCalled();
  });
  it('deletes only after confirmation and blocks repeated deletion', async () => {
    const { component, api, response, dialog } = await setup();
    const deleted = spyOn(component.deleted, 'emit');
    component.openEdit({ id: 10, amount: -20, wallet: { id: 7 } }, true);
    expect(api.deleteEntry).not.toHaveBeenCalled();
    component.save(); component.save();
    expect(api.deleteEntry).toHaveBeenCalledOnceWith(10);
    component.close(); expect(dialog.close).not.toHaveBeenCalled();
    response.next({});
    expect(component.busy).toBeFalse(); expect(deleted).toHaveBeenCalled();
    expect(dialog.close).toHaveBeenCalled();
  });
  it('keeps the confirmation open when deletion fails', async () => {
    const { component, response, dialog } = await setup();
    const deleted = spyOn(component.deleted, 'emit');
    component.openEdit({ id: 10 }, true); component.save();
    response.error(new Error('Server error'));
    expect(component.busy).toBeFalse(); expect(component.error).toContain('delete');
    expect(dialog.close).not.toHaveBeenCalled(); expect(deleted).not.toHaveBeenCalled();
  });

  it('renders the type and all values after cancelling and reopening the same movement', async () => {
    const { fixture, component } = await setup();
    component.categories = [{ id: 3, name: 'Food' }];
    const entry: AccountEntry = { id: 10, wallet: { id: 7 }, type_operation: { id: 2 }, amount: -12.34, date: '2026-10-01', comment: 'Lunch', category: { id: 3 } };
    for (let attempt = 0; attempt < 2; attempt++) {
      component.openEdit(entry);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      const type = element.querySelector('#movement-type') as HTMLSelectElement;
      expect(type.selectedOptions[0]?.textContent).toBe('Expense');
      expect((element.querySelector('#movement-amount') as HTMLInputElement).value).toBe('12.34');
      expect((element.querySelector('#movement-date') as HTMLInputElement).value).toBe('2026-10-01');
      expect((element.querySelector('#movement-comment') as HTMLTextAreaElement).value).toBe('Lunch');
      expect(component.draft.categoryId).toBe(3);
      component.draft.comment = 'Unsaved change';
      component.cancel(new Event('cancel'));
    }
  });
  it('resets to create defaults after closing an edit without clearing the new draft', async () => {
    const { fixture, component } = await setup();
    component.openEdit({ id: 10, wallet: { id: 7 }, type_operation: { id: 1 }, amount: 20, comment: 'Income' });
    fixture.detectChanges(); await fixture.whenStable();
    component.close(); component.open(7);
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(component.draft.typeId).toBe(2);
    expect(component.draft.walletId).toBe(7);
    expect(component.draft.amount).toBeNull();
    expect(component.draft.comment).toBe('');
    expect((fixture.nativeElement.querySelector('#movement-type') as HTMLSelectElement).selectedOptions[0]?.textContent).toBe('Expense');
  });

});
