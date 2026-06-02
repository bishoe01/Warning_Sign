import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, radius, shadow, spacing } from '@/constants/theme';
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/i18n/languages';

export function LanguageTabs({
  value,
  onChange,
}: {
  value: AppLanguage;
  onChange: (language: AppLanguage) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabs}>
      {SUPPORTED_LANGUAGES.map((language) => {
        const active = language.code === value;
        return (
          <Pressable
            key={language.code}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(language.code)}>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{language.nativeName}</Text>
            <Text style={[styles.subText, active && styles.tabTextActive]}>{language.englishName}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabs: { gap: spacing.xs, paddingVertical: 2 },
  tab: {
    minWidth: 92,
    paddingVertical: 9,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
  },
  tabActive: { backgroundColor: colors.surface, ...shadow.card },
  tabText: { fontSize: 13, color: colors.textTertiary, fontWeight: '600' },
  subText: { marginTop: 2, fontSize: 10, color: colors.textTertiary, fontWeight: '600' },
  tabTextActive: { color: colors.text, fontWeight: '800' },
});
