import { I18nService } from './i18n.service';
import { translations } from './translations';

describe('Language and locale', () => {
  afterEach(() => { localStorage.removeItem('cash_balance_language'); document.documentElement.lang = 'es'; });
  it('switches labels, formats and document language without changing data values', () => {
    const service = new I18nService();
    service.setLanguage('es');
    expect(service.t('Overview')).toBe('Resumen');
    expect(service.money(12345.67).replace(/\s/g, ' ')).toBe('12.345,67 €');
    expect(service.date('2026-01-02')).toContain('ene');
    expect(service.t('Archive “{name}”?', { name: 'My wallet' })).toBe('¿Archivar «My wallet»?');
    service.setLanguage('en');
    expect(service.t('Overview')).toBe('Overview');
    expect(service.money(12345.67)).toBe('€12,345.67');
    expect(service.date('2026-01-02')).toContain('Jan');
    expect(document.documentElement.lang).toBe('en');
    expect(new I18nService().language).toBe('en');
  });
  it('keeps dates in UTC and has matching translation keys for both languages', () => {
    const service = new I18nService(); service.setLanguage('en');
    expect(service.date('2026-01-02T00:00:00Z')).toContain('02');
    expect(service.date('invalid')).toBe('');
    expect(Object.keys(translations.es).sort()).toEqual(Object.keys(translations.en).sort());
    expect(Object.values(translations.es).every(Boolean)).toBeTrue();
    expect(Object.values(translations.en).every(Boolean)).toBeTrue();
  });
});
