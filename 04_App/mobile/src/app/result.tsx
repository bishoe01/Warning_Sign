import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CautionCard } from '@/components/CautionCard';
import { LanguageTabs } from '@/components/LanguageTabs';
import { SummaryCard } from '@/components/SummaryCard';
import { labels } from '@/constants/labels';
import type { Language } from '@/data/sampleAnalysis';
import { session } from '@/data/session';

export default function ResultScreen() {
  const [language, setLanguage] = useState<Language>('ko');
  const t = labels[language];
  // loading 화면이 저장한 결과(실제 또는 폴백 샘플)를 읽는다.
  const data = session.getResult();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <LanguageTabs value={language} onChange={setLanguage} />

      <Text style={styles.sectionTitle}>{t.summaryTitle}</Text>
      <SummaryCard summary={data.summary} labels={t} />

      <Text style={styles.sectionTitle}>{t.cautionTitle}</Text>
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
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
    marginTop: 8,
  },
  cautionList: {
    gap: 12,
  },
  notice: {
    marginTop: 12,
    backgroundColor: '#F2F4F7',
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  noticeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667085',
  },
  noticeText: {
    fontSize: 13,
    color: '#475467',
    lineHeight: 19,
  },
});
