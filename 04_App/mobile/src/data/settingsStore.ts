import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_LANGUAGE, isAppLanguage, type AppLanguage } from '@/i18n/languages';

const KEY = '@contract-helper/settings';

export type UserSettings = {
  language: AppLanguage;
};

const DEFAULT_SETTINGS: UserSettings = {
  language: DEFAULT_LANGUAGE,
};

export async function get(): Promise<UserSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      language: isAppLanguage(parsed.language) ? parsed.language : DEFAULT_LANGUAGE,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function setLanguage(language: AppLanguage): Promise<UserSettings> {
  const next = { language };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
