import { UnsavedChangesService } from '../../shared/forms/unsaved-changes.service';
import { FormUiModule } from '../../shared/forms/form-ui.module';
import { I18nModule } from '../../i18n/i18n.module';
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthFrontService } from '../../auth/auth.service';
import { I18nService, Language } from '../../i18n/i18n.service';
import { CashBalanceService } from '../../core/cash-balance.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormUiModule, I18nModule, CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  @ViewChild('profileForm') profileForm?: NgForm;
  @ViewChild('languageForm') languageForm?: NgForm;
  @ViewChild('passwordForm') passwordForm?: NgForm;
  get busy() { return this.saving || this.languageSaving || this.changingPassword; }
  loading = true;
  saving = false;
  error = '';
  success = false;
  id?: number;
  username = '';
  email = '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  changingPassword = false;
  passwordError = '';

  language: Language = 'es';
  languageSaving = false;
  languageLoading = true;
  languageError = '';
  languageSaved = false;

  saveLanguage() {
    if (this.busy || this.languageLoading) return;
    this.languageSaving = true;
    this.languageError = '';
    this.languageSaved = false;
    this.api.updatePreferences(this.language).subscribe({
      next: preferences => {
        this.i18n.setLanguage(preferences.language);
        this.languageSaving = false;
        this.languageSaved = true;
        this.languageForm?.form.markAsPristine();
      },
      error: () => { this.languageSaving = false; this.languageError = 'We could not save your language. Please try again.'; }
    });
  }
  loadLanguage() {
    this.languageLoading = true;
    this.languageError = '';
    this.api.preferences().subscribe({
      next: preferences => {
        this.language = preferences.language;
        this.i18n.setLanguage(preferences.language);
        this.languageLoading = false;
      },
      error: () => { this.languageLoading = false; this.languageError = 'We could not load your language preference.'; }
    });
  }

  constructor(private api: CashBalanceService, private auth: AuthFrontService, private router: Router, private i18n: I18nService, private unsaved: UnsavedChangesService) { this.language = i18n.language; }

  get currentPasswordTooLong() { return new TextEncoder().encode(this.currentPassword).length > 72; }

  get passwordValidationError(): string {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) return 'Completa los tres campos.';
    if (new TextEncoder().encode(this.currentPassword).length > 72) return 'La contraseña actual supera el límite de 72 bytes.';
    if (!this.newPassword.trim() || Array.from(this.newPassword).length < 8) return 'La nueva contraseña debe tener al menos 8 caracteres.';
    if (new TextEncoder().encode(this.newPassword).length > 72) return 'La nueva contraseña supera el límite de 72 bytes. Usa menos caracteres.';
    if (this.currentPassword === this.newPassword) return 'La nueva contraseña debe ser diferente de la actual.';
    if (this.newPassword !== this.confirmPassword) return 'Las contraseñas no coinciden.';
    return '';
  }

  changePassword(form: NgForm, confirmed = false) {
    if (this.busy || this.passwordValidationError) return;
    if (!confirmed) {
      const discard = this.unsaved.confirmDiscard([this.profileForm, this.languageForm]);
      if (discard instanceof Promise) { void discard.then(accepted => { if (accepted) this.changePassword(form, true); }); return; }
      if (!discard) return;
    }
    this.changingPassword = true;
    this.passwordError = '';
    this.api.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        form.resetForm();
        this.currentPassword = this.newPassword = this.confirmPassword = '';
        this.changingPassword = false;
        this.auth.logout();
        this.router.navigate(['/login'], { state: { passwordChanged: true } });
      },
      error: (error: HttpErrorResponse) => {
        this.changingPassword = false;
        this.passwordError = error.status === 403 ? 'La contraseña actual es incorrecta.'
          : error.status === 400 ? 'La nueva contraseña no es válida o coincide con la actual.'
          : error.status === 401 ? 'Tu sesión ha caducado. Inicia sesión de nuevo.'
          : 'No se ha podido cambiar la contraseña. Inténtalo de nuevo.';
      }
    });
  }

  ngOnInit() { this.load(); this.loadLanguage(); }

  load() {
    this.loading = true;
    this.error = '';
    this.api.profile().subscribe({
      next: user => {
        this.id = user.id;
        this.username = user.username ?? '';
        this.email = user.email ?? '';
        this.loading = false;
      },
      error: () => { this.loading = false; this.error = 'No se ha podido cargar tu perfil.'; }
    });
  }

  save() {
    if (!this.id || this.busy || this.profileForm?.invalid || !this.username.trim() || !this.email.trim()) return;
    this.saving = true;
    this.error = '';
    this.success = false;
    this.api.updateProfile({ id: this.id, username: this.username.trim(), email: this.email.trim() }).subscribe({
      next: user => {
        this.username = user.username ?? this.username.trim();
        this.email = user.email ?? this.email.trim();
        this.saving = false;
        this.success = true;
        this.profileForm?.form.markAsPristine();
      },
      error: () => { this.saving = false; this.error = 'No se han podido guardar los cambios. Revisa los datos e inténtalo de nuevo.'; }
    });
  }
}
