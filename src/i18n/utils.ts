import { defaultLang, ui, type UiKey } from './ui';

export function useTranslations(lang: keyof typeof ui) {
  const localizedUI: Record<string, string> = ui[lang];
  return function t(key: UiKey) {
    return key in localizedUI ? localizedUI[key] : ui[defaultLang][key];
  };
}

export type Lang = keyof typeof ui;
