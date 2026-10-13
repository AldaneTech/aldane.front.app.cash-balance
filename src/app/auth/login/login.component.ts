import { NgForm } from '@angular/forms';
import { UnsavedChangesService } from '../../shared/forms/unsaved-changes.service';
import { Component, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, UserService } from '@aldanetech/cash-balance-api-client-angular';
import { AuthFrontService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  constructor(private router: Router, private authService: AuthService,
    private authFrontService: AuthFrontService, private userService: UserService, route: ActivatedRoute, private unsaved: UnsavedChangesService) {
    this.sessionExpired = route.snapshot.queryParamMap.get('reason') === 'session-expired';
    this.passwordChanged = router.getCurrentNavigation()?.extras.state?.['passwordChanged'] === true;
  }
  @ViewChild('loginForm') loginForm?: NgForm;
  @ViewChild('registerForm') registerForm?: NgForm;
  readonly passwordChanged: boolean;
  readonly sessionExpired: boolean;
  selected: 'SignIn' | 'SignUp' = 'SignIn';
  username = '';
  password = '';
  email = '';
  registerPassword = '';
  confirmPassword = '';
  submitting = false;
  error = '';
  success = '';

  select(option: 'SignIn' | 'SignUp') {
    if (this.submitting || option === this.selected) return;
    this.unsaved.close(this.selected === 'SignIn' ? this.loginForm : this.registerForm, false, () => {
      this.selected = option;
      this.error = this.success = '';
      this.password = this.registerPassword = this.confirmPassword = '';
    });
  }

  get registrationError(): string {
    if (this.username.trim().length < 4 || this.username.trim().length > 20) return 'El usuario debe tener entre 4 y 20 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) return 'Introduce un correo electrónico válido.';
    if (!this.registerPassword.trim() || Array.from(this.registerPassword).length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (new TextEncoder().encode(this.registerPassword).length > 72) return 'La contraseña supera el límite de 72 bytes. Usa menos caracteres.';
    if (this.confirmPassword !== this.registerPassword) return 'Las contraseñas no coinciden.';
    return '';
  }

  onLogin() {
    if (this.submitting) return;
    this.error = '';
    if (!this.username.trim() || !this.password) {
      this.error = 'Introduce tu usuario y contraseña.';
      return;
    }
    this.submitting = true;
    this.authService.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: response => {
        this.submitting = false;
        if (!response?.token) {
          this.error = 'No se ha podido iniciar sesión. Inténtalo de nuevo.';
          return;
        }
        this.loginForm?.form.markAsPristine();
        this.authFrontService.login(response.token);
        this.password = '';
        this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.error = error.status === 401 || error.status === 403
          ? 'Usuario o contraseña incorrectos.'
          : error.status === 0 ? 'No se puede conectar con el servidor. Inténtalo de nuevo.'
          : 'No se ha podido iniciar sesión. Inténtalo de nuevo.';
      }
    });
  }

  onRegister() {
    if (this.submitting) return;
    this.error = this.registrationError;
    if (this.error) return;
    this.submitting = true;
    this.success = '';
    this.userService.createUser({ username: this.username.trim(), email: this.email.trim(), password: this.registerPassword }).subscribe({
      next: user => {
        this.submitting = false;
        if (!user?.id) {
          this.error = 'No se ha podido crear la cuenta. Inténtalo de nuevo.';
          return;
        }
        this.username = user.username ?? this.username.trim();
        this.password = this.registerPassword = this.confirmPassword = '';
        this.email = '';
        this.registerForm?.form.markAsPristine();
        this.selected = 'SignIn';
        this.success = 'Cuenta creada correctamente. Ya puedes iniciar sesión.';
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.error = error.status === 400 || error.status === 409
          ? 'No se ha podido crear la cuenta. Revisa los datos o prueba con otro usuario y correo.'
          : error.status === 0 ? 'No se puede conectar con el servidor. Inténtalo de nuevo.'
          : 'No se ha podido crear la cuenta. Inténtalo de nuevo.';
      }
    });
  }
}
