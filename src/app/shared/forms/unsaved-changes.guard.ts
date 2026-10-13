import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { AuthFrontService } from '../../auth/auth.service';
import { UnsavedChangesService } from './unsaved-changes.service';

@Injectable({ providedIn: 'root' })
export class UnsavedChangesGuard implements CanDeactivate<unknown> {
  constructor(private unsaved: UnsavedChangesService, private auth: AuthFrontService) {}
  canDeactivate() {
    // Session expiration must still be able to redirect to the login screen.
    return !this.auth.isLoggedIn() || this.unsaved.canLeave();
  }
}
