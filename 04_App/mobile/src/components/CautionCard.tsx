import { StyleSheet, Text, View } from 'react-native';

import type { LabelSet } from '@/constants/labels';
import type { CautionItem, CautionLevel, Language } from '@/data/sampleAnalysis';

const LEVEL_STYLE: Record<CautionLevel, { color: string; bg: string }> = {
  check: { color: '#B42318', bg: '#FEF3F2' },
  review: { color: '#B54708', bg: '#FFFAEB' },
  info: { color: '#175CD3', bg: '#EFF8FF' },
};

function pickExplanation(item: CautionItem, language: Language): string {
  if (language === 'en') return item.explanationEn;
  if (language === 'vi') return item.explanationVi;
  return item.explanationKo;
}

export function CautionCard({
  item,
  language,
  labels,
}: {
  item: CautionItem;
  language: Language;
  labels: LabelSet;
}) {
  const level = LEVEL_STYLE[item.level];

  return (
    <View style={[styles.card, { borderLeftColor: level.color }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: level.bg }]}>
          <Text style={[styles.badgeText, { color: level.color }]}>{labels.levels[item.level]}</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
      </View>

      <View style={styles.originalBox}>
        <Text style={styles.originalLabel}>{labels.original}</Text>
        <Text style={styles.originalText}>“{item.originalText}”</Text>
      </View>

      <Text style={styles.explanation}>{pickExplanation(item, language)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderLeftWidth: 4,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#101828',
  },
  originalBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  originalLabel: {
    fontSize: 11,
    color: '#98A2B3',
    fontWeight: '600',
  },
  originalText: {
    fontSize: 13,
    color: '#475467',
    lineHeight: 19,
  },
  explanation: {
    fontSize: 14,
    color: '#101828',
    lineHeight: 21,
  },
});
