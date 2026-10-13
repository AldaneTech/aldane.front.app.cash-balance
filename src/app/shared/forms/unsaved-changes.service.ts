import { Injectable } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ConfirmationService } from './confirmation.service';

interface FormState { active: () => boolean; busy: () => boolean; form: NgForm; }
@Injectable({ providedIn: 'root' })
export class UnsavedChangesService {
  private readonly forms = new Set<FormState>();
  constructor(private confirmation: ConfirmationService) {}
  register(state: FormState) { this.forms.add(state); return () => { this.forms.delete(state); }; }
  get pending() { return [...this.forms].some(state => state.active() && (state.busy() || state.form.dirty)); }
  canLeave(): boolean | Promise<boolean> {
    const active = [...this.forms].filter(state => state.active());
    if (active.some(state => state.busy())) return false;
    return this.confirmDiscard(active.map(state => state.form));
  }
  confirmDiscard(forms: (NgForm | undefined)[]): boolean | Promise<boolean> {
    const dirty = forms.filter((form): form is NgForm => !!form?.dirty);
    if (!dirty.length) return true;
    return this.confirmation.ask().then(confirmed => {
      if (confirmed) dirty.forEach(form => form.form.markAsPristine());
      return confirmed;
    });
  }
  close(form: NgForm | undefined, busy: boolean, close: () => void) {
    if (busy) return;
    const decision = this.confirmDiscard([form]);
    if (typeof decision === 'boolean') { if (decision) close(); }
    else void decision.then(confirmed => { if (confirmed) close(); });
  }
}
