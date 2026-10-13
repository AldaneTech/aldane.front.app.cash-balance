import { Directive, DoCheck, ElementRef, Input, OnDestroy, Optional, OnInit, Renderer2, Self } from '@angular/core';
import { NgControl, NgForm } from '@angular/forms';
import { I18nService } from '../../i18n/i18n.service';

@Directive({ selector: '[ngModel][appFieldFeedback]', standalone: true })
export class FieldFeedbackDirective implements OnInit, DoCheck, OnDestroy {
  @Input() fieldMessage = '';
  private feedback: HTMLElement;
  private originalDescription: string;
  constructor(@Self() private control: NgControl, @Optional() private form: NgForm,
    private element: ElementRef<HTMLElement>, private renderer: Renderer2, private i18n: I18nService) {
    const host = element.nativeElement;
    this.originalDescription = host.getAttribute('aria-describedby') ?? '';
    this.feedback = renderer.createElement('p');
    this.feedback.id = `${host.id || 'field-' + Math.random().toString(36).slice(2)}-feedback`;
    renderer.addClass(this.feedback, 'field-feedback');
    renderer.setAttribute(this.feedback, 'aria-live', 'polite');
  }
  ngOnInit() {
    const host = this.element.nativeElement;
    // Floating-label inputs need feedback outside their positioned wrapper.
    const anchor = host.parentElement?.classList.contains('relative') ? host.parentElement : host;
    this.renderer.insertBefore(anchor.parentElement, this.feedback, anchor.nextSibling);
  }
  ngDoCheck() {
    const errors = this.control.errors;
    const visible = this.control.dirty || this.control.touched || this.form?.submitted;
    let message = this.fieldMessage;
    if (errors?.['required']) message = 'This field is required.';
    else if (errors?.['whitespace'] || errors?.['pattern']) message = 'Enter a value other than spaces.';
    else if (errors?.['email']) message = 'Enter a valid email address.';
    else if (errors?.['minlength']) message = this.i18n.t('Use at least {count} characters.', { count: errors['minlength'].requiredLength });
    else if (errors?.['maxlength']) message = this.i18n.t('Use no more than {count} characters.', { count: errors['maxlength'].requiredLength });
    else if (errors?.['money'] || errors?.['min'] || errors?.['max']) message = 'Enter a positive amount with up to two decimal places within the allowed limit.';
    else if (errors?.['password']) message = 'Use at least 8 characters and no more than 72 bytes.';
    else if (errors?.['mismatch']) message = 'Passwords do not match.';
    const show = !!visible && !!message && !this.control.disabled;
    this.renderer.setProperty(this.feedback, 'textContent', show ? this.i18n.t(message) : '');
    this.renderer.setProperty(this.feedback, 'hidden', !show);
    this.renderer.setAttribute(this.element.nativeElement, 'aria-invalid', String(show));
    const description = [this.originalDescription, show ? this.feedback.id : ''].filter(Boolean).join(' ');
    if (description) this.renderer.setAttribute(this.element.nativeElement, 'aria-describedby', description);
    else this.renderer.removeAttribute(this.element.nativeElement, 'aria-describedby');
  }
  ngOnDestroy() { this.renderer.removeChild(this.feedback.parentElement, this.feedback); }
}
