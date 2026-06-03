import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { analyzeContract } from '@/api/contractApi';
import { colors, spacing } from '@/constants/theme';
import * as historyStore from '@/data/historyStore';
import { session } from '@/data/session';
import { useI18n } from '@/i18n/useI18n';

const STEP_MS = 900;

export default function LoadingScreen() {
  const router = useRouter();
  const { language, t } = useI18n();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pageCount = session.getImages().length;
  const STEPS = useMemo(() => [
    t.loading.upload,
    pageCount > 1 ? t.loading.ocrMulti(pageCount) : t.loading.ocrSingle,
    t.loading.analyze,
    t.loading.simplify,
  ], [pageCount, t]);

  // 중앙 아이콘 펄스 링 애니메이션
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // 단계 메시지를 순차로 표시
    for (let i = 1; i < STEPS.length; i += 1) {
      timers.push(
        setTimeout(() => {
          if (!cancelled) setStep(i);
        }, i * STEP_MS),
      );
    }

    const startedAt = Date.now();
    const minDisplayMs = STEPS.length * STEP_MS;

    void (async () => {
      const uris = session.getImages();
      if (uris.length === 0) {
        setError('분석할 계약서 사진이 없습니다.');
        return;
      }
      try {
        const result = await analyzeContract(uris, language);
        if (cancelled) return;
        const isSample = !!result.isSample;
        session.setResult(result, { isSample, error: null });
        void historyStore.save(result, uris, { isSample }).catch(() => { /* 저장 실패는 흐름 안 막음 */ });
        const wait = Math.max(0, minDisplayMs - (Date.now() - startedAt));
        timers.push(setTimeout(() => { if (!cancelled) router.replace('/result'); }, wait));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'request failed');
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [language, router, STEPS]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.errorIcon}>
            <Feather name="alert-triangle" size={32} color="#B45309" />
          </View>
          <View style={styles.errorCopy}>
            <Text style={styles.errorTitle}>분석에 실패했어요</Text>
            <Text style={styles.errorDesc}>
              서버가 실제 분석을 끝내지 못했습니다. 더미 결과를 보여주지 않고 다시 시도하도록 막았습니다.
            </Text>
            <Text style={styles.errorReason}>{error}</Text>
          </View>
          <View style={styles.errorActions}>
            <Pressable style={styles.secondaryBtn} onPress={() => router.replace('/select')}>
              <Text style={styles.secondaryText}>다시 촬영</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => router.replace('/')}>
              <Text style={styles.primaryText}>홈으로</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Animated.View
            style={[styles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]}
          />
          <View style={styles.badge}>
            <Feather name="file-text" size={32} color={colors.white} />
          </View>
        </View>

        <Text style={styles.step}>{STEPS[step]}</Text>

        <View style={styles.progress}>
          {STEPS.map((label, index) => (
            <View key={label} style={[styles.segment, index <= step && styles.segmentActive]} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxxl, gap: spacing.xxl },
  iconWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  step: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center', lineHeight: 25 },
  progress: { flexDirection: 'row', gap: 6, width: 160 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  segmentActive: { backgroundColor: colors.primary },
  errorIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCopy: { gap: spacing.sm, alignItems: 'center' },
  errorTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  errorDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, textAlign: 'center' },
  errorReason: { fontSize: 12, color: colors.textTertiary, lineHeight: 18, textAlign: 'center' },
  errorActions: { flexDirection: 'row', gap: spacing.sm },
  secondaryBtn: {
    paddingVertical: 13,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    backgroundColor: colors.bgElevated,
  },
  secondaryText: { fontSize: 15, fontWeight: '800', color: colors.textSecondary },
  primaryBtn: {
    paddingVertical: 13,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  primaryText: { fontSize: 15, fontWeight: '800', color: colors.white },
});
