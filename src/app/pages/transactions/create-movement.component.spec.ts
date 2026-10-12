import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AccountEntry } from '@aldanetech/cash-balance-api-client-angular';
import { CashBalanceService } from '../../core/cash-balance.service';
import { CreateMovementComponent } from './create-movement.component';

describe('CreateMovementComponent', () => {
  async function setup() {
    const response = new Subject<AccountEntry>();
    const api = { createEntry: jasmine.createSpy().and.returnValue(response) };
    await TestBed.configureTestingModule({ imports: [CreateMovementComponent], providers: [{ provide: CashBalanceService, useValue: api }] }).compileComponents();
    const fixture = TestBed.createComponent(CreateMovementComponent);
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
});
