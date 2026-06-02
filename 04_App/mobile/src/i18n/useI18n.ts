import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import * as settingsStore from '@/data/settingsStore';
import { DEFAULT_LANGUAGE, type AppLanguage } from '@/i18n/languages';
import { translations } from '@/i18n/translations';

export function useI18n() {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE);

  const reload = useCallback(() => {
    settingsStore.get().then((settings) => setLanguageState(settings.language));
  }, []);

  useFocusEffect(useCallback(() => {
    reload();
  }, [reload]));

  const setLanguage = useCallback(async (next: AppLanguage) => {
    await settingsStore.setLanguage(next);
    setLanguageState(next);
  }, []);

  return {
    language,
    setLanguage,
    t: translations[language],
  };
}
