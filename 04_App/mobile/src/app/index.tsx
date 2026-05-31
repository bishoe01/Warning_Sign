import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>📄</Text>
        <Text style={styles.title}>AI 근로계약서{'\n'}도우미</Text>
        <Text style={styles.subtitle}>
          한국어 근로계약서를 촬영하면{'\n'}핵심 조건과 확인할 조항을 쉽게 설명해 드려요.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => router.push('/select')}>
        <Text style={styles.buttonText}>계약서 분석 시작</Text>
      </Pressable>

      <Text style={styles.disclaimer}>이 앱은 법률 자문이 아니라 참고용 안내를 제공합니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: '#F9FAFB',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#101828',
    textAlign: 'center',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 15,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#208AEF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 12,
    color: '#98A2B3',
    textAlign: 'center',
  },
});
