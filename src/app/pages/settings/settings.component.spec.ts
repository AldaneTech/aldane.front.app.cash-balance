import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { CashBalanceService, CatalogItem } from '../../core/cash-balance.service';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  async function setup() {
    const response = new Subject<CatalogItem>();
    const api = {
      myCatalogs: jasmine.createSpy().and.returnValue(of({ Category: [], Brand: [], Store: [] })),
      saveCatalog: jasmine.createSpy().and.returnValue(response), deleteCatalog: jasmine.createSpy().and.returnValue(response)
    };
    await TestBed.configureTestingModule({ imports: [SettingsComponent], providers: [{ provide: CashBalanceService, useValue: api }] }).compileComponents();
    const fixture = TestBed.createComponent(SettingsComponent); fixture.detectChanges();
    const component = fixture.componentInstance;
    const dialog = component.editor.nativeElement;
    spyOn(dialog, 'showModal'); spyOn(dialog, 'close');
    return { fixture, component, dialog, api, response };
  }
  it('locks the editor while saving the selected type and reloads on success', async () => {
    const { component, dialog, api, response } = await setup();
    component.select(component.tabs[1]); component.open(); component.draft = { name: ' Brand ', comment: ' Description ' };
    component.submit(); component.cancel(new Event('cancel')); component.submit();
    expect(dialog.close).not.toHaveBeenCalled();
    expect(api.saveCatalog).toHaveBeenCalledOnceWith('Brand', { name: 'Brand', comment: 'Description' });
    response.next({ id: 1 });
    expect(component.creating).toBeFalse(); expect(dialog.close).toHaveBeenCalled();
    expect(api.myCatalogs).toHaveBeenCalledTimes(2);
  });
  it('requires confirmation before removing a store and keeps the dialog on error', async () => {
    const { component, dialog, api, response } = await setup();
    component.select(component.tabs[2]); component.open({ id: 8, name: 'Shop' }, true);
    expect(api.deleteCatalog).not.toHaveBeenCalled();
    component.submit(); expect(api.deleteCatalog).toHaveBeenCalledOnceWith('Store', 8);
    response.error(new Error('Server error'));
    expect(component.creating).toBeFalse(); expect(dialog.close).not.toHaveBeenCalled();
    expect(component.draft.name).toBe('Shop'); expect(component.error).toContain('try again');
  });
});
