import { booleanAttribute, Directive, HostListener, Input, OnDestroy, OnInit, Self } from '@angular/core';
import { NgForm } from '@angular/forms';
import { UnsavedChangesService } from './unsaved-changes.service';

@Directive({ selector: 'form[appUnsavedForm]', standalone: true })
export class UnsavedFormDirective implements OnInit, OnDestroy {
  @Input({ transform: booleanAttribute }) appUnsavedForm = true;
  @Input() formBusy = false;
  private unregister?: () => void;
  constructor(@Self() private form: NgForm, private unsaved: UnsavedChangesService) {}
  ngOnInit() {
    this.unregister = this.unsaved.register({ form: this.form, active: () => this.appUnsavedForm, busy: () => this.formBusy });
  }
  @HostListener('window:beforeunload', ['$event'])
  preventUnload(event: BeforeUnloadEvent) {
    if (this.appUnsavedForm && (this.formBusy || this.form.dirty)) { event.preventDefault(); event.returnValue = ''; }
  }
  ngOnDestroy() { this.unregister?.(); }
}
