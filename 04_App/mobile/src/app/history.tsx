import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing } from '@/constants/theme';
import * as historyStore from '@/data/historyStore';
import type { HistoryRecord } from '@/data/historyStore';
import { getLocalized } from '@/i18n/localized';
import { useI18n } from '@/i18n/useI18n';

function formatDate(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function HistoryScreen() {
  const router = useRouter();
  const { language, t } = useI18n();
  const [records, setRecords] = useState<HistoryRecord[]>([]);

  const reload = useCallback(() => { historyStore.list().then(setRecords); }, []);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const onDelete = (id: string) => { historyStore.remove(id).then(reload); };
  const onClearAll = () => {
    if (records.length === 0) return;
    Alert.alert(t.history.clearTitle, t.history.clearMessage, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.common.clearAll, style: 'destructive', onPress: () => historyStore.clearAll().then(reload) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.history.title}</Text>
        <Pressable onPress={onClearAll} hitSlop={10} style={styles.backBtn}>
          {records.length > 0 && <Feather name="trash-2" size={20} color={colors.textTertiary} />}
        </Pressable>
      </View>

      {records.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="inbox" size={40} color={colors.border} />
          <Text style={styles.emptyText}>{t.history.empty}</Text>
          <Pressable style={styles.emptyCta} onPress={() => router.replace('/select')}>
            <Text style={styles.emptyCtaText}>{t.history.start}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.privacyNote}>{t.history.privacy}</Text>
          {records.map((r) => {
            const uris = historyStore.pageUris(r);
            return (
              <Swipeable key={r.id} renderRightActions={() => (
                <Pressable style={styles.swipeDelete} onPress={() => onDelete(r.id)}>
                  <Feather name="trash-2" size={20} color={colors.white} />
                  <Text style={styles.swipeDeleteText}>{t.common.delete}</Text>
                </Pressable>
              )}>
                <Pressable style={styles.row} onPress={() => router.push(`/result?id=${r.id}`)}>
                  <View style={styles.thumbBox}>
                    {uris[0]
                      ? <Image source={{ uri: uris[0] }} style={styles.thumb} contentFit="cover" />
                      : <Feather name="file-text" size={22} color={colors.textTertiary} />}
                    {r.imageFiles.length > 1 && <Text style={styles.pageBadge}>{t.history.pages(r.imageFiles.length)}</Text>}
                  </View>
                  <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                      <Text style={styles.rowDate}>{formatDate(r.createdAt)}</Text>
                      {r.isSample && <Text style={styles.sampleBadge}>{t.history.sample}</Text>}
                    </View>
                    <Text style={styles.rowSummary} numberOfLines={1}>
                      {getLocalized(r.result.summary.contractPeriod, language)} · {getLocalized(r.result.summary.salary, language)}
                    </Text>
                    <Text style={styles.rowCaution}>{t.history.cautions(r.result.cautionItems.length)}</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.textTertiary} />
                </Pressable>
              </Swipeable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
  emptyCta: { marginTop: spacing.sm, backgroundColor: colors.primary, paddingVertical: 13, paddingHorizontal: spacing.xxl, borderRadius: radius.lg },
  emptyCtaText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  list: { padding: spacing.lg, gap: spacing.md },
  privacyNote: { fontSize: 12, color: colors.textTertiary, textAlign: 'center', marginBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  thumbBox: { width: 52, height: 64, borderRadius: 8, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  pageBadge: { position: 'absolute', right: 2, bottom: 2, fontSize: 9, fontWeight: '800', color: colors.white,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, overflow: 'hidden' },
  rowBody: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowDate: { fontSize: 12, color: colors.textTertiary, fontWeight: '600' },
  sampleBadge: { fontSize: 10, fontWeight: '800', color: colors.textSecondary, backgroundColor: colors.bgElevated,
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5, overflow: 'hidden' },
  rowSummary: { fontSize: 14, color: colors.text, fontWeight: '700' },
  rowCaution: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  swipeDelete: { width: 88, backgroundColor: '#E5484D', alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: radius.lg, marginLeft: spacing.sm },
  swipeDeleteText: { color: colors.white, fontSize: 12, fontWeight: '700' },
});
