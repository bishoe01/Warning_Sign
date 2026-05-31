import { StyleSheet, Text, View } from 'react-native';

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
        <View
          key={row.label}
          style={[styles.row, index < rows.length - 1 && styles.rowBorder]}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  label: {
    width: 84,
    fontSize: 14,
    color: '#667085',
    fontWeight: '500',
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#101828',
    lineHeight: 20,
  },
});
