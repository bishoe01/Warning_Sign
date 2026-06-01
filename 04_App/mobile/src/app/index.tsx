import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Feather name="file-text" size={15} color={colors.white} />
          </View>
          <Text style={styles.brandName}>근로계약 도우미</Text>
          <View style={{ flex: 1 }} />
          <Pressable style={styles.historyEntry} hitSlop={8} onPress={() => router.push('/history')}>
            <Feather name="clock" size={15} color={colors.textSecondary} />
            <Text style={styles.historyEntryText}>내 기록</Text>
          </Pressable>
        </View>

        <View style={styles.headlineBlock}>
          <Text style={styles.headline}>계약서 사진 한 장이면{'\n'}핵심 조건이 한눈에</Text>
          <Text style={styles.sub}>
            임금·근무시간·휴일은 물론,{'\n'}놓치기 쉬운 위험 조항까지 쉽게 알려드려요
          </Text>
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

        <View style={styles.bottom}>
          <Pressable
            style={({ pressed }) => [styles.cta, shadow.button, pressed && styles.ctaPressed]}
            onPress={() => router.push('/select')}>
            <Text style={styles.ctaText}>계약서 분석 시작</Text>
          </Pressable>
          <Text style={styles.disclaimer}>법률 자문이 아닌 참고용 안내입니다</Text>
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
  historyEntry: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: colors.bgElevated, borderRadius: 999 },
  historyEntryText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
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
