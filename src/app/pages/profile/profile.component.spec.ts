import { UnsavedChangesService } from '../../shared/forms/unsaved-changes.service';
import { ConfirmationService } from '../../shared/forms/confirmation.service';
import { I18nService } from '../../i18n/i18n.service';
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
  let i18n: I18nService;
  afterEach(() => localStorage.removeItem('cash_balance_language'));
  beforeEach(() => {
    api = jasmine.createSpyObj('CashBalanceService', ['changePassword', 'preferences', 'updatePreferences']);
    auth = jasmine.createSpyObj('AuthFrontService', ['logout']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    form = jasmine.createSpyObj('NgForm', ['resetForm']);
    i18n = new I18nService();
    component = new ProfileComponent(api, auth, router, i18n, new UnsavedChangesService(new ConfirmationService()));
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
  it('restores the saved account language and applies changes only after saving', () => {
    api.preferences.and.returnValue(of({ language: 'en' }));
    component.loadLanguage();
    expect(component.language).toBe('en'); expect(i18n.language).toBe('en');
    component.language = 'es';
    api.updatePreferences.and.returnValue(of({ language: 'es' }));
    component.saveLanguage();
    expect(api.updatePreferences).toHaveBeenCalledWith('es');
    expect(i18n.language).toBe('es'); expect(component.languageSaved).toBeTrue();
  });
  it('keeps the active language when saving fails', () => {
    i18n.setLanguage('en'); component.language = 'es'; component.languageLoading = false;
    api.updatePreferences.and.returnValue(throwError(() => ({ status: 500 })));
    component.saveLanguage();
    expect(i18n.language).toBe('en'); expect(component.languageSaving).toBeFalse();
    expect(component.languageError).toBeTruthy(); expect(component.languageSaved).toBeFalse();
  });

});
