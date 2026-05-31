import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow } from '@/constants/theme';
import type { Language } from '@/data/sampleAnalysis';

const TABS: { key: Language; label: string }[] = [
  { key: 'ko', label: '한국어' },
  { key: 'en', label: 'English' },
  { key: 'vi', label: 'Tiếng Việt' },
];

export function LanguageTabs({
  value,
  onChange,
}: {
  value: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <View style={styles.tabs}>
      {TABS.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(tab.key)}>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: radius.md, padding: 3 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: radius.sm + 1, alignItems: 'center' },
  tabActive: { backgroundColor: colors.surface, ...shadow.card },
  tabText: { fontSize: 13, color: colors.textTertiary, fontWeight: '600' },
  tabTextActive: { color: colors.text, fontWeight: '800' },
});
