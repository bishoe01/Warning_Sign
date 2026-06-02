import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing } from '@/constants/theme';
import * as historyStore from '@/data/historyStore';
import type { HistoryRecord } from '@/data/historyStore';
import { getLocalized } from '@/i18n/localized';
import { languageName } from '@/i18n/languages';
import { useI18n } from '@/i18n/useI18n';

const SETTINGS_ROUTE = '/settings' as never;

export default function HomeScreen() {
  const router = useRouter();
  const { language, t } = useI18n();
  const [latest, setLatest] = useState<HistoryRecord | null>(null);

  useFocusEffect(useCallback(() => {
    historyStore.list().then((records) => setLatest(records[0] ?? null));
  }, []));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Feather name="file-text" size={15} color={colors.white} />
          </View>
          <Text style={styles.brandName}>{t.common.appName}</Text>
          <View style={{ flex: 1 }} />
          <Pressable style={styles.languageEntry} hitSlop={8} onPress={() => router.push(SETTINGS_ROUTE)}>
            <Feather name="globe" size={14} color={colors.primary} />
            <Text style={styles.languageEntryText}>{languageName(language)}</Text>
          </Pressable>
          <Pressable style={styles.iconEntry} hitSlop={8} onPress={() => router.push(SETTINGS_ROUTE)}>
            <Feather name="settings" size={17} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.headlineBlock}>
          <Text style={styles.headline}>{t.home.headline}</Text>
          <Text style={styles.sub}>{t.home.sub}</Text>
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.heroCircle}>
            <View style={styles.docCard}>
              <View style={[styles.docLine, styles.docLineDark, { width: '62%' }]} />
              <View style={[styles.docLine, { width: '92%' }]} />
              <View style={[styles.docLine, { width: '80%' }]} />
              <View style={[styles.docLine, { width: '88%' }]} />
              <View style={[styles.docLine, { width: '70%' }]} />
            </View>
            <View style={styles.checkBadge}>
              <Feather name="check" size={22} color={colors.white} />
            </View>
          </View>
        </View>

        <Pressable
          style={styles.recent}
          onPress={() => (latest ? router.push(`/result?id=${latest.id}`) : router.push('/history'))}>
          <View style={styles.recentHead}>
            <Text style={styles.recentTitle}>{t.home.recentTitle}</Text>
            <Pressable hitSlop={8} onPress={() => router.push('/history')}>
              <Text style={styles.recentLink}>{t.home.viewAll}</Text>
            </Pressable>
          </View>
          {latest ? (
            <View style={styles.recentRow}>
              <View style={styles.recentThumb}>
                {historyStore.pageUris(latest)[0]
                  ? <Image source={{ uri: historyStore.pageUris(latest)[0] }} style={styles.recentImage} contentFit="cover" />
                  : <Feather name="file-text" size={20} color={colors.textTertiary} />}
              </View>
              <View style={styles.recentBody}>
                <Text style={styles.recentMain} numberOfLines={1}>
                  {getLocalized(latest.result.summary.salary, language)}
                </Text>
                <Text style={styles.recentMeta}>
                  {t.home.pages(latest.imageFiles.length || 1)} · {t.home.cautions(latest.result.cautionItems.length)}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textTertiary} />
            </View>
          ) : (
            <Text style={styles.recentEmpty}>{t.home.recentEmpty}</Text>
          )}
        </Pressable>

        <View style={styles.bottom}>
          <Pressable
            style={({ pressed }) => [styles.cta, shadow.button, pressed && styles.ctaPressed]}
            onPress={() => router.push('/select')}>
            <Text style={styles.ctaText}>{t.home.start}</Text>
          </Pressable>
          <Text style={styles.disclaimer}>{t.common.legalNotice}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1, paddingHorizontal: spacing.xl },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: spacing.sm },
  brandMark: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontSize: 13, fontWeight: '800', color: colors.text },
  languageEntry: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingHorizontal: 9, backgroundColor: colors.primarySoft, borderRadius: 999, maxWidth: 116 },
  languageEntryText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  iconEntry: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  headlineBlock: { marginTop: spacing.xxxl },
  headline: { fontSize: 25, fontWeight: '800', color: colors.text, lineHeight: 34 },
  sub: { marginTop: spacing.md, fontSize: 14, fontWeight: '500', color: colors.textSecondary, lineHeight: 22 },
  heroWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroCircle: {
    width: 200,
    height: 190,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docCard: {
    width: 108,
    height: 132,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 16,
    transform: [{ rotate: '-6deg' }],
    ...shadow.float,
  },
  docLine: { height: 6, borderRadius: 3, backgroundColor: colors.border, marginTop: 9 },
  docLineDark: { backgroundColor: colors.borderStrong, marginTop: 0 },
  checkBadge: {
    position: 'absolute',
    bottom: 30,
    right: 34,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadow.button,
  },
  recent: { marginBottom: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  recentHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  recentTitle: { flex: 1, fontSize: 13, color: colors.textSecondary, fontWeight: '800' },
  recentLink: { fontSize: 12, color: colors.primary, fontWeight: '800' },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  recentThumb: { width: 40, height: 48, borderRadius: 8, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  recentImage: { width: '100%', height: '100%' },
  recentBody: { flex: 1, gap: 3 },
  recentMain: { fontSize: 13, color: colors.text, fontWeight: '800' },
  recentMeta: { fontSize: 12, color: colors.textTertiary, fontWeight: '700' },
  recentEmpty: { fontSize: 13, color: colors.textTertiary, fontWeight: '700' },
  bottom: { paddingBottom: spacing.lg },
  cta: {
    backgroundColor: colors.primary,
    paddingVertical: 17,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  ctaPressed: { backgroundColor: colors.primaryPressed, transform: [{ scale: 0.985 }] },
  ctaText: { fontSize: 16, fontWeight: '800', color: colors.white },
  disclaimer: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    fontWeight: '500',
  },
});
