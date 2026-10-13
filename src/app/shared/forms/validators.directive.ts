import { Directive, forwardRef, Input, OnChanges } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';

export function validMoney(value: unknown): boolean {
  const amount = Number(value);
  return value !== null && value !== '' && Number.isFinite(amount) && amount > 0 && amount <= 999999999999.99
    && Math.abs(amount * 100 - Math.round(amount * 100)) < 0.000001;
}
@Directive({ selector: '[ngModel][appMoney]', standalone: true,
  providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() => MoneyValidatorDirective), multi: true }] })
export class MoneyValidatorDirective implements Validator {
  validate(control: AbstractControl) { return validMoney(control.value) ? null : { money: true }; }
}
@Directive({ selector: '[ngModel][appPassword]', standalone: true,
  providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() => PasswordValidatorDirective), multi: true }] })
export class PasswordValidatorDirective implements Validator {
  validate(control: AbstractControl) {
    const value = String(control.value ?? '');
    return !value || (value.trim() && Array.from(value).length >= 8 && new TextEncoder().encode(value).length <= 72) ? null : { password: true };
  }
}
@Directive({ selector: '[ngModel][appMatches]', standalone: true,
  providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() => MatchesValidatorDirective), multi: true }] })
export class MatchesValidatorDirective implements Validator, OnChanges {
  @Input() appMatches = '';
  private changed = () => {};
  validate(control: AbstractControl) { return !control.value || control.value === this.appMatches ? null : { mismatch: true }; }
  registerOnValidatorChange(changed: () => void) { this.changed = changed; }
  ngOnChanges() { this.changed(); }
}
