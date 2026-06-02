import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing } from '@/constants/theme';
import type { Summary } from '@/data/sampleAnalysis';
import { getLocalized } from '@/i18n/localized';
import type { AppLanguage } from '@/i18n/languages';
import type { Translation } from '@/i18n/translations';

export function SummaryCard({
  summary,
  language,
  labels,
}: {
  summary: Summary;
  language: AppLanguage;
  labels: Translation['result'];
}) {
  const rows = [
    { label: labels.fields.salary, value: getLocalized(summary.salary, language) },
    { label: labels.fields.workHours, value: getLocalized(summary.workHours, language) },
    { label: labels.fields.holiday, value: getLocalized(summary.holiday, language) },
    { label: labels.fields.contractPeriod, value: getLocalized(summary.contractPeriod, language) },
    { label: labels.fields.deduction, value: getLocalized(summary.deduction, language) },
  ];

  return (
    <View style={styles.card}>
      {rows.map((row, index) => (
        <View key={row.label} style={[styles.row, index < rows.length - 1 && styles.rowBorder]}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.lg, ...shadow.card },
  row: { flexDirection: 'row', paddingVertical: 13, gap: spacing.md, alignItems: 'flex-start' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.bg },
  label: { width: 64, fontSize: 13, color: colors.textTertiary, fontWeight: '600' },
  value: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '700', lineHeight: 20 },
});
