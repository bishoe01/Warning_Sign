import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#101828',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#F9FAFB' },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="select" options={{ title: '계약서 선택' }} />
        <Stack.Screen name="loading" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="result" options={{ title: '분석 결과' }} />
      </Stack>
    </>
  );
}
