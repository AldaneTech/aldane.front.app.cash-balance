import { NgModule } from '@angular/core';
import { FieldFeedbackDirective } from './field-feedback.directive';
import { UnsavedFormDirective } from './unsaved-form.directive';
import { MatchesValidatorDirective, MoneyValidatorDirective, PasswordValidatorDirective } from './validators.directive';

const directives = [FieldFeedbackDirective, UnsavedFormDirective, MatchesValidatorDirective, MoneyValidatorDirective, PasswordValidatorDirective];
@NgModule({ imports: directives, exports: directives })
export class FormUiModule {}
