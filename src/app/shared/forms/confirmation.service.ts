import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  readonly message$ = new BehaviorSubject<string | null>(null);
  private pending?: Promise<boolean>;
  private answer?: (confirmed: boolean) => void;
  ask(message = 'You have unsaved changes. Discard them and continue?'): Promise<boolean> {
    if (this.pending) return this.pending;
    this.pending = new Promise(resolve => { this.answer = resolve; });
    this.message$.next(message);
    return this.pending;
  }
  resolve(confirmed: boolean) {
    const answer = this.answer;
    this.answer = undefined;
    this.pending = undefined;
    this.message$.next(null);
    answer?.(confirmed);
  }
}
