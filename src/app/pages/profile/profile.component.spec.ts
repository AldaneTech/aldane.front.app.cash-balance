import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthFrontService } from '../../auth/auth.service';
import { CashBalanceService } from '../../core/cash-balance.service';
import { ProfileComponent } from './profile.component';

describe('Profile password change', () => {
  let component: ProfileComponent;
  let api: jasmine.SpyObj<CashBalanceService>;
  let auth: jasmine.SpyObj<AuthFrontService>;
  let router: jasmine.SpyObj<Router>;
  let form: jasmine.SpyObj<NgForm>;
  beforeEach(() => {
    api = jasmine.createSpyObj('CashBalanceService', ['changePassword']);
    auth = jasmine.createSpyObj('AuthFrontService', ['logout']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    form = jasmine.createSpyObj('NgForm', ['resetForm']);
    component = new ProfileComponent(api, auth, router);
    component.currentPassword = 'current-password';
    component.newPassword = component.confirmPassword = 'new-password';
  });
  it('rejects mismatch, repeated password, short and oversized UTF-8 passwords', () => {
    component.confirmPassword = 'different';
    component.changePassword(form);
    expect(api.changePassword).not.toHaveBeenCalled();
    component.newPassword = component.confirmPassword = component.currentPassword;
    expect(component.passwordValidationError).toContain('diferente');
    component.newPassword = component.confirmPassword = 'short';
    expect(component.passwordValidationError).toContain('8 caracteres');
    component.newPassword = component.confirmPassword = 'é'.repeat(37);
    expect(component.passwordValidationError).toContain('72 bytes');
  });
  it('preserves password spaces and clears credentials and session after success', () => {
    component.newPassword = component.confirmPassword = ' new-password ';
    api.changePassword.and.returnValue(of(undefined));
    component.changePassword(form);
    expect(api.changePassword).toHaveBeenCalledWith('current-password', ' new-password ');
    expect(form.resetForm).toHaveBeenCalled();
    expect(component.currentPassword + component.newPassword + component.confirmPassword).toBe('');
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { state: { passwordChanged: true } });
  });
  it('reports an incorrect current password without logging out', () => {
    api.changePassword.and.returnValue(throwError(() => ({ status: 403 })));
    component.changePassword(form);
    expect(component.passwordError).toContain('actual es incorrecta');
    expect(component.changingPassword).toBeFalse();
    expect(auth.logout).not.toHaveBeenCalled();
  });
});
