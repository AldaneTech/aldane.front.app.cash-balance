import { I18nService } from '../../i18n/i18n.service';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Subject, of, Observable } from 'rxjs';
import { Wallet } from '@aldanetech/cash-balance-api-client-angular';
import { resource, CashBalanceService } from '../../core/cash-balance.service';
import { WalletsComponent } from './wallets.component';

describe('Wallet creation', () => {
  afterEach(() => {
    localStorage.removeItem('cash_balance_language');
    document.documentElement.lang = 'es';
  });
  async function setup() {
    const response = new Subject<Wallet>();
    const api = {
      view: (_name: string, trigger: Observable<any>, fetch: (params: any) => Observable<any>) => resource(trigger, fetch),
      updateWallet: jasmine.createSpy().and.returnValue(response),
      archiveWallet: jasmine.createSpy().and.returnValue(response),
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
    TestBed.inject(I18nService).setLanguage('en');
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
  it('prefills and reopens the edit form without losing its values', async () => {
    const { component, fixture } = await setup();
    const wallet = { id: 7, name: 'Daily', comment: 'My expenses' };
    for (let attempt = 0; attempt < 2; attempt++) {
      component.openEdit(wallet); fixture.detectChanges();
      await fixture.whenStable(); fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#wallet-name').value).toBe('Daily');
      expect(fixture.nativeElement.querySelector('#wallet-comment').value).toBe('My expenses');
      component.draft.name = 'Unsaved'; component.closeCreate();
    }
  });
  it('updates only the editable fields and allows clearing the description', async () => {
    const { component, api, response } = await setup();
    component.openEdit({ id: 7, name: 'Daily', comment: 'Old', budget: 100 });
    component.draft = { name: ' Updated ', comment: '' };
    component.createWallet(); component.createWallet();
    expect(api.updateWallet).toHaveBeenCalledOnceWith({ id: 7, name: 'Updated', comment: '' });
    expect(api.createWallet).not.toHaveBeenCalled();
    response.next({ id: 7, name: 'Updated' });
    expect(component.successMessage).toContain('updated');
    expect(api.wallets).toHaveBeenCalledTimes(2);
  });
  it('requires archive confirmation, prevents duplicates and returns to all wallets', async () => {
    const { component, api, response, dialog } = await setup();
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.returnValue(Promise.resolve(true));
    component.openEdit({ id: 7, name: 'Daily' }, true);
    expect(api.archiveWallet).not.toHaveBeenCalled();
    component.createWallet(); component.createWallet();
    component.cancelCreate(new Event('cancel'));
    expect(dialog.close).not.toHaveBeenCalled();
    expect(api.archiveWallet).toHaveBeenCalledOnceWith(7);
    response.next({}); await Promise.resolve();
    expect(navigate).toHaveBeenCalledWith(['/wallets']);
    expect(component.successMessage).toContain('preserved');
    expect(component.creating).toBeFalse();
  });
  it('keeps archive confirmation open on failure so it can be retried', async () => {
    const { component, response, dialog } = await setup();
    component.openEdit({ id: 7, name: 'Daily' }, true); component.createWallet();
    response.error(new Error('Offline'));
    expect(component.createError).toContain('archive');
    expect(component.creating).toBeFalse(); expect(dialog.close).not.toHaveBeenCalled();
  });

});
