import { Injectable } from '@angular/core';
import { translations } from './translations';

export type Language = 'es' | 'en';
@Injectable({ providedIn: 'root' })
export class I18nService {
  language: Language = localStorage.getItem('cash_balance_language') === 'en' ? 'en' : 'es';
  constructor() { document.documentElement.lang = this.language; }
  get locale() { return this.language === 'es' ? 'es-ES' : 'en-GB'; }
  setLanguage(language: Language) {
    this.language = language;
    localStorage.setItem('cash_balance_language', language);
    document.documentElement.lang = language;
  }
  t(value: string | null | undefined, params: Record<string, unknown> = {}): string {
    const text = translations[this.language][value ?? ''] ?? value ?? '';
    return text.replace(/\{(\w+)\}/g, (match, name: string) => name in params ? String(params[name] ?? '') : match);
  }
  money(value: unknown) {
    return new Intl.NumberFormat(this.locale, { style: 'currency', currency: 'EUR' }).format(Number(value ?? 0));
  }
  number(value: unknown, digits = 0) {
    return new Intl.NumberFormat(this.locale, { maximumFractionDigits: digits }).format(Number(value ?? 0));
  }
  date(value: string | number | Date | null | undefined, short = false) {
    if (value == null || value === '') return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(this.locale, { day: '2-digit', month: 'short', ...(short ? {} : { year: 'numeric' }), timeZone: 'UTC' }).format(date);
  }
}
