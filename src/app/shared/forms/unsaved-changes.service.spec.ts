import { FormControl, NgForm } from '@angular/forms';
import { ConfirmationService } from './confirmation.service';
import { UnsavedChangesService } from './unsaved-changes.service';
import { UnsavedChangesGuard } from './unsaved-changes.guard';
import { AuthFrontService } from '../../auth/auth.service';

function draft() {
  const form = new NgForm([], []);
  form.form.addControl('name', new FormControl('Draft'));
  form.form.markAsDirty();
  return form;
}
describe('Unsaved form protection', () => {
  let confirmation: ConfirmationService;
  let service: UnsavedChangesService;
  beforeEach(() => { confirmation = new ConfirmationService(); service = new UnsavedChangesService(confirmation); });
  it('keeps the draft when leaving is cancelled and marks it clean only after confirmation', async () => {
    const form = draft();
    service.register({ form, active: () => true, busy: () => false });
    const cancelled = service.canLeave(); confirmation.resolve(false);
    expect(await cancelled).toBeFalse(); expect(form.dirty).toBeTrue();
    expect(form.value.name).toBe('Draft');
    const accepted = service.canLeave(); confirmation.resolve(true);
    expect(await accepted).toBeTrue(); expect(form.dirty).toBeFalse();
    expect(service.canLeave()).toBeTrue();
  });
  it('ignores closed forms and unregisters destroyed views', () => {
    const unregister = service.register({ form: draft(), active: () => false, busy: () => false });
    expect(service.pending).toBeFalse(); expect(service.canLeave()).toBeTrue(); unregister();
    expect(service.pending).toBeFalse();
  });
  it('blocks navigation and closing while a write is in progress', () => {
    const form = draft(); const close = jasmine.createSpy('close');
    service.register({ form, active: () => true, busy: () => true });
    expect(service.canLeave()).toBeFalse(); service.close(form, true, close);
    expect(close).not.toHaveBeenCalled(); expect(confirmation.message$.value).toBeNull();
  });
  it('confirms before cancelling a dirty dialog and closes clean dialogs immediately', async () => {
    const form = draft(); const close = jasmine.createSpy('close');
    service.close(form, false, close); expect(close).not.toHaveBeenCalled();
    confirmation.resolve(false); await Promise.resolve(); expect(close).not.toHaveBeenCalled();
    service.close(form, false, close); confirmation.resolve(true);
    await Promise.resolve(); await Promise.resolve(); expect(close).toHaveBeenCalledTimes(1);
    service.close(form, false, close); expect(close).toHaveBeenCalledTimes(2);
  });
  it('never traps an expired session behind a discard prompt', () => {
    const auth = jasmine.createSpyObj<AuthFrontService>('AuthFrontService', ['isLoggedIn']);
    auth.isLoggedIn.and.returnValue(false);
    service.register({ form: draft(), active: () => true, busy: () => true });
    expect(new UnsavedChangesGuard(service, auth).canDeactivate()).toBeTrue();
  });
});
