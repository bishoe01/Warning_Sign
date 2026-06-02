import { DEFAULT_LANGUAGE, type AppLanguage } from '@/i18n/languages';

export type LocalizedText = Partial<Record<AppLanguage, string>>;

export function text(value: string): LocalizedText {
  return {
    ko: value,
    en: value,
  };
}

export function getLocalized(value: LocalizedText | string | undefined, language: AppLanguage): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[language] ?? value.en ?? value[DEFAULT_LANGUAGE] ?? '';
}
