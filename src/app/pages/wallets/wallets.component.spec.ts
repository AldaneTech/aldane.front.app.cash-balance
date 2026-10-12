import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Subject, of } from 'rxjs';
import { Wallet } from '@aldanetech/cash-balance-api-client-angular';
import { CashBalanceService } from '../../core/cash-balance.service';
import { WalletsComponent } from './wallets.component';

describe('Wallet creation', () => {
  async function setup() {
    const response = new Subject<Wallet>();
    const api = {
      createWallet: jasmine.createSpy().and.returnValue(response),
      wallets: jasmine.createSpy().and.returnValue(of([])),
      summary: () => of({ balance: 0, income: 0, expenses: 0, entryCount: 0 }),
      monthly: () => of([]), entries: () => of({ items: [] })
    };
    await TestBed.configureTestingModule({
      imports: [WalletsComponent, RouterTestingModule],
      providers: [{ provide: CashBalanceService, useValue: api }, { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({})) } }]
    }).compileComponents();
    const fixture = TestBed.createComponent(WalletsComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const dialog = component.createDialog.nativeElement;
    spyOn(dialog, 'showModal');
    spyOn(dialog, 'close');
    component.openCreate();
    component.draft = { name: ' Daily ', comment: ' My expenses ' };
    return { fixture, component, dialog, api, response };
  }
  it('locks the dialog, prevents duplicate requests, then closes and refreshes on success', async () => {
    const { fixture, component, dialog, api, response } = await setup();
    component.createWallet();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('fieldset').disabled).toBeTrue();
    component.cancelCreate(new Event('cancel'));
    component.createWallet();
    expect(dialog.close).not.toHaveBeenCalled();
    expect(api.createWallet).toHaveBeenCalledOnceWith({ name: 'Daily', comment: 'My expenses' });
    response.next({ id: 7, name: 'Daily' });
    expect(component.creating).toBeFalse();
    expect(dialog.close).toHaveBeenCalledTimes(1);
    expect(component.successMessage).toContain('successfully');
    expect(api.wallets).toHaveBeenCalledTimes(2);
  });
  it('keeps the draft and dialog on failure and allows retrying', async () => {
    const { component, dialog, response } = await setup();
    component.createWallet();
    response.error(new Error('Server failure'));
    expect(dialog.close).not.toHaveBeenCalled();
    expect(component.creating).toBeFalse();
    expect(component.draft.name).toBe(' Daily ');
    expect(component.createError).toContain('try again');
  });
});
