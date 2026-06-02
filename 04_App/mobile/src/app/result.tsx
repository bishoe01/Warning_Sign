import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CautionCard } from '@/components/CautionCard';
import { LanguageTabs } from '@/components/LanguageTabs';
import { SummaryCard } from '@/components/SummaryCard';
import { labels } from '@/constants/labels';
import { colors, radius, spacing } from '@/constants/theme';
import * as historyStore from '@/data/historyStore';
import type { Language } from '@/data/sampleAnalysis';
import { session } from '@/data/session';

export default function ResultScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>('ko');
  const { id } = useLocalSearchParams<{ id?: string }>();
  const fromHistory = !!id;
  const [record, setRecord] = useState<historyStore.HistoryRecord | null>(null);
  const [viewer, setViewer] = useState<string | null>(null);
  useEffect(() => { if (id) historyStore.get(id).then((r) => (r ? setRecord(r) : router.back())); }, [id]);

  // 기록 로딩 중엔 직전 분석(session)이 한 프레임 보이는 깜빡임 방지 (모든 훅 선언 뒤에 위치)
  if (fromHistory && !record) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Feather name="chevron-left" size={26} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>분석 결과</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  const data = fromHistory ? record!.result : session.getResult();
  const imageUris = fromHistory ? historyStore.pageUris(record!) : session.getImages();
  const t = labels[language];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => (fromHistory ? router.back() : router.replace('/'))} hitSlop={10} style={styles.backBtn}>
          <Feather name={fromHistory ? 'chevron-left' : 'home'} size={fromHistory ? 26 : 22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>분석 결과</Text>
        {fromHistory ? (
          <Pressable hitSlop={10} style={styles.backBtn} onPress={() => {
            Alert.alert('삭제', '이 분석 기록을 지울까요?', [
              { text: '취소', style: 'cancel' },
              { text: '삭제', style: 'destructive', onPress: () => historyStore.remove(id!).then(() => router.back()) },
            ]);
          }}>
            <Feather name="trash-2" size={20} color={colors.textTertiary} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {!fromHistory && (
          <View style={styles.savedNote}>
            <Feather name="check-circle" size={14} color={colors.primary} />
            <Text style={styles.savedNoteText}>이 기기에 저장됐어요 · 홈의 '내 기록'에서 다시 볼 수 있어요</Text>
          </View>
        )}
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

        {imageUris.length > 0 && (
          <View style={styles.originalBlock}>
            <Text style={styles.sectionTitle}>계약서 원본 {imageUris.length}장</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {imageUris.map((uri, i) => (
                <Pressable key={uri + i} onPress={() => setViewer(uri)}>
                  <Image source={{ uri }} style={styles.originalThumb} contentFit="cover" />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <Pressable style={styles.viewerBackdrop} onPress={() => setViewer(null)}>
          {viewer && <Image source={{ uri: viewer }} style={styles.viewerImg} contentFit="contain" />}
        </Pressable>
      </Modal>
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
  savedNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primarySoft,
    borderRadius: radius.md, paddingVertical: 9, paddingHorizontal: spacing.md },
  savedNoteText: { flex: 1, fontSize: 12, color: colors.primary, fontWeight: '700' },
  originalBlock: { marginTop: spacing.sm, gap: spacing.sm },
  originalThumb: { width: 92, height: 124, borderRadius: radius.md, backgroundColor: colors.bgElevated },
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  viewerImg: { width: '100%', height: '85%' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
