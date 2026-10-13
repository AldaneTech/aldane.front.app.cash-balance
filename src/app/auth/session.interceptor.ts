import { ConfirmationService } from '../shared/forms/confirmation.service';
import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Configuration } from '@aldanetech/cash-balance-api-client-angular';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthFrontService } from './auth.service';

@Injectable()
export class SessionInterceptor implements HttpInterceptor {
  private redirecting = false;
  constructor(private auth: AuthFrontService, private router: Router, private configuration: Configuration, private confirmation: ConfirmationService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const base = this.configuration.basePath?.replace(/\/$/, '') ?? '';
    const path = request.url.split('?')[0];
    const protectedRequest = !!base && path.startsWith(`${base}/`) && path !== `${base}/login` && path !== `${base}/createUser`;
    const sessionToken = localStorage.getItem('auth_token');
    return next.handle(request).pipe(catchError((error: HttpErrorResponse) => {
      // A late response from an old session must not log out a newly signed-in user.
      if (protectedRequest && error.status === 401 && sessionToken === localStorage.getItem('auth_token')) {
        this.confirmation.resolve(false);
        this.auth.logout();
        if (!this.redirecting && this.router.url.split('?')[0] !== '/login') {
          this.redirecting = true;
          void this.router.navigate(['/login'], { queryParams: { reason: 'session-expired' }, replaceUrl: true })
            .finally(() => { this.redirecting = false; });
        }
      }
      return throwError(() => error);
    }));
  }
}
