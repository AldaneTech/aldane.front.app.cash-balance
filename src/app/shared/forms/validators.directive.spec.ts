import { FormControl } from '@angular/forms';
import { MatchesValidatorDirective, PasswordValidatorDirective, validMoney } from './validators.directive';

describe('Shared field validation', () => {
  it('rejects empty, negative, oversized and sub-cent amounts', () => {
    for (const value of [null, '', undefined, 0, -1, NaN, Infinity, 1.001, 1000000000000]) expect(validMoney(value)).toBeFalse();
    for (const value of [0.01, 12.34, 999999999999.99]) expect(validMoney(value)).toBeTrue();
  });
  it('checks password code points and UTF-8 bytes without trimming the saved password', () => {
    const validator = new PasswordValidatorDirective();
    expect(validator.validate(new FormControl('é'.repeat(37)))).toEqual({ password: true });
    expect(validator.validate(new FormControl('😀'.repeat(4)))).toEqual({ password: true });
    expect(validator.validate(new FormControl('😀'.repeat(8)))).toBeNull();
    expect(validator.validate(new FormControl(' password '))).toBeNull();
  });
  it('revalidates confirmation when the original password changes', () => {
    const validator = new MatchesValidatorDirective(); const changed = jasmine.createSpy('changed');
    validator.registerOnValidatorChange(changed); validator.appMatches = 'first-password';
    expect(validator.validate(new FormControl('first-password'))).toBeNull();
    validator.appMatches = 'second-password'; validator.ngOnChanges();
    expect(changed).toHaveBeenCalled();
    expect(validator.validate(new FormControl('first-password'))).toEqual({ mismatch: true });
  });
});
