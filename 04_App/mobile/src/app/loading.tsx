import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { analyzeContract } from '@/api/contractApi';
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

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#208AEF" />
      <Text style={styles.step}>{STEPS[step]}</Text>
      <View style={styles.dots}>
        {STEPS.map((label, index) => (
          <View key={label} style={[styles.dot, index <= step && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
    backgroundColor: '#F9FAFB',
  },
  step: {
    fontSize: 16,
    color: '#344054',
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D5DD',
  },
  dotActive: {
    backgroundColor: '#208AEF',
  },
});
