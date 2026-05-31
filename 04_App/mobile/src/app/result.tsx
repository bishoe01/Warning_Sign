import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CautionCard } from '@/components/CautionCard';
import { LanguageTabs } from '@/components/LanguageTabs';
import { SummaryCard } from '@/components/SummaryCard';
import { labels } from '@/constants/labels';
import { colors, radius, spacing } from '@/constants/theme';
import type { Language } from '@/data/sampleAnalysis';
import { session } from '@/data/session';

export default function ResultScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>('ko');
  const t = labels[language];
  // loading 화면이 저장한 결과(실제 또는 폴백 샘플)를 읽는다.
  const data = session.getResult();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>분석 결과</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <LanguageTabs value={language} onChange={setLanguage} />

        <Text style={styles.sectionTitle}>{t.summaryTitle}</Text>
        <SummaryCard summary={data.summary} labels={t} />

        <View style={styles.cautionHead}>
          <Text style={styles.sectionTitle}>{t.cautionTitle}</Text>
          <Text style={styles.count}>{data.cautionItems.length}</Text>
        </View>
        <View style={styles.cautionList}>
          {data.cautionItems.map((item, index) => (
            <CautionCard key={index} item={item} language={language} labels={t} />
          ))}
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeLabel}>{t.noticeLabel}</Text>
          <Text style={styles.noticeText}>{data.notice}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  cautionHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: spacing.sm },
  count: { fontSize: 17, fontWeight: '800', color: colors.primary },
  cautionList: { gap: spacing.md },
  notice: { marginTop: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: 4 },
  noticeLabel: { fontSize: 11, fontWeight: '800', color: colors.textTertiary },
  noticeText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});
