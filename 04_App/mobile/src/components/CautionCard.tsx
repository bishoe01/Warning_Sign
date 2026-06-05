import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, levelColors, radius, shadow, spacing } from '@/constants/theme';
import type { CautionItem } from '@/data/sampleAnalysis';
import { getLocalized } from '@/i18n/localized';
import type { AppLanguage } from '@/i18n/languages';
import type { Translation } from '@/i18n/translations';

export function CautionCard({
  item,
  language,
  labels,
  canShowSource = false,
  onOpenSource,
}: {
  item: CautionItem;
  language: AppLanguage;
  labels: Translation['result'];
  canShowSource?: boolean;
  onOpenSource?: (item: CautionItem) => void;
}) {
  const lv = levelColors[item.level];
  const hasUsableSource = !!item.source && item.source.confidence !== 'low' && item.source.boxes.length > 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: lv.bg }]}>
          <Text style={[styles.badgeText, { color: lv.fg }]}>{labels.levels[item.level]}</Text>
        </View>
        <Text style={styles.title}>{getLocalized(item.title, language)}</Text>
      </View>

      <View style={styles.quote}>
        <Text style={styles.quoteLabel}>{labels.original}</Text>
        <Text style={styles.quoteText}>“{item.originalText}”</Text>
      </View>

      <Text style={styles.explanation}>{getLocalized(item.explanation, language)}</Text>

      {canShowSource && (
        hasUsableSource && onOpenSource ? (
          <Pressable style={styles.sourceAction} onPress={() => onOpenSource(item)}>
            <Feather name="image" size={16} color={colors.primary} />
            <Text style={styles.sourceActionText}>{labels.sourceAction}</Text>
          </Pressable>
        ) : (
          <View style={styles.sourceUnavailable}>
            <Feather name="alert-circle" size={15} color={colors.textTertiary} />
            <Text style={styles.sourceUnavailableText}>{labels.sourceUnavailable}</Text>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, ...shadow.card },
  header: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 7 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  quote: { backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: spacing.md, gap: 4 },
  quoteLabel: { fontSize: 10, fontWeight: '700', color: colors.textTertiary },
  quoteText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  explanation: { fontSize: 14, color: colors.text, lineHeight: 22, fontWeight: '500' },
  sourceAction: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingVertical: 4 },
  sourceActionText: { fontSize: 13, color: colors.primary, fontWeight: '800' },
  sourceUnavailable: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sourceUnavailableText: { flex: 1, fontSize: 12, color: colors.textTertiary, fontWeight: '700', lineHeight: 17 },
});
