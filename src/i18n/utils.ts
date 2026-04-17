import zh from './zh.json';
import en from './en.json';
import ko from './ko.json';

const translations: Record<string, Record<string, string>> = { zh, en, ko };

export function t(key: string, lang: string = 'zh'): string {
  return translations[lang]?.[key] ?? translations['en']?.[key] ?? key;
}

export function useTranslations(lang: string) {
  return (key: string) => t(key, lang);
}
