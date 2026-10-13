import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthFrontService } from '../../auth/auth.service';
import { CashBalanceService } from '../../core/cash-balance.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
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

  constructor(private api: CashBalanceService, private auth: AuthFrontService, private router: Router) {}

  get passwordValidationError(): string {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) return 'Completa los tres campos.';
    if (new TextEncoder().encode(this.currentPassword).length > 72) return 'La contraseña actual supera el límite de 72 bytes.';
    if (!this.newPassword.trim() || Array.from(this.newPassword).length < 8) return 'La nueva contraseña debe tener al menos 8 caracteres.';
    if (new TextEncoder().encode(this.newPassword).length > 72) return 'La nueva contraseña supera el límite de 72 bytes. Usa menos caracteres.';
    if (this.currentPassword === this.newPassword) return 'La nueva contraseña debe ser diferente de la actual.';
    if (this.newPassword !== this.confirmPassword) return 'Las contraseñas no coinciden.';
    return '';
  }

  changePassword(form: NgForm) {
    if (this.changingPassword || this.passwordValidationError) return;
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

  ngOnInit() { this.load(); }

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
    if (!this.id || this.saving || !this.username.trim() || !this.email.trim()) return;
    this.saving = true;
    this.error = '';
    this.success = false;
    this.api.updateProfile({ id: this.id, username: this.username.trim(), email: this.email.trim() }).subscribe({
      next: user => {
        this.username = user.username ?? this.username.trim();
        this.email = user.email ?? this.email.trim();
        this.saving = false;
        this.success = true;
      },
      error: () => { this.saving = false; this.error = 'No se han podido guardar los cambios. Revisa los datos e inténtalo de nuevo.'; }
    });
  }
}
