import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { analyzeContract } from '@/api/contractApi';
import { colors, spacing } from '@/constants/theme';
import { sampleAnalysis } from '@/data/sampleAnalysis';
import { session } from '@/data/session';

// idea_.md 10절: 분석 중 단계별 안내 문구
const STEPS = [
  '계약서 이미지를 업로드하고 있어요.',
  'OCR로 계약서 문장을 읽고 있어요.',
  'AI가 임금·근무시간·휴일 조건을 분석하고 있어요.',
  '확인이 필요한 조항을 쉬운 문장으로 정리하고 있어요.',
];

const STEP_MS = 900;

export default function LoadingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);

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

    // 서버에 분석 요청. 실패하면 로컬 샘플로 폴백(데모가 끊기지 않게).
    void (async () => {
      const uri = session.getImage();
      let result = sampleAnalysis;
      try {
        if (uri) {
          result = await analyzeContract(uri, 'ko');
        }
      } catch {
        result = sampleAnalysis;
      }
      if (cancelled) return;
      session.setResult(result);
      const wait = Math.max(0, minDisplayMs - (Date.now() - startedAt));
      timers.push(
        setTimeout(() => {
          if (!cancelled) router.replace('/result');
        }, wait),
      );
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [router]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

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
});
