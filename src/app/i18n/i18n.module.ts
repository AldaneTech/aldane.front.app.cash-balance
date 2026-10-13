import { NgModule, Pipe, PipeTransform } from '@angular/core';
import { I18nService } from './i18n.service';

@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  constructor(private i18n: I18nService) {}
  transform(value: string | null | undefined, params?: Record<string, unknown>) { return this.i18n.t(value, params); }
}
@Pipe({ name: 'money', standalone: true, pure: false })
export class MoneyPipe implements PipeTransform {
  constructor(private i18n: I18nService) {}
  transform(value: unknown) { return this.i18n.money(value); }
}
@Pipe({ name: 'localDate', standalone: true, pure: false })
export class LocalDatePipe implements PipeTransform {
  constructor(private i18n: I18nService) {}
  transform(value: string | number | Date | null | undefined, short = false) { return this.i18n.date(value, short); }
}
@Pipe({ name: 'localNumber', standalone: true, pure: false })
export class LocalNumberPipe implements PipeTransform {
  constructor(private i18n: I18nService) {}
  transform(value: unknown) { return this.i18n.number(value); }
}
@NgModule({ imports: [TranslatePipe, MoneyPipe, LocalDatePipe, LocalNumberPipe], exports: [TranslatePipe, MoneyPipe, LocalDatePipe, LocalNumberPipe] })
export class I18nModule {}
