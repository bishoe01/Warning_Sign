import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing } from '@/constants/theme';
import type { LabelSet } from '@/constants/labels';
import type { Summary } from '@/data/sampleAnalysis';

export function SummaryCard({ summary, labels }: { summary: Summary; labels: LabelSet }) {
  const rows = [
    { label: labels.fields.salary, value: summary.salary },
    { label: labels.fields.workHours, value: summary.workHours },
    { label: labels.fields.holiday, value: summary.holiday },
    { label: labels.fields.contractPeriod, value: summary.contractPeriod },
    { label: labels.fields.deduction, value: summary.deduction },
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
