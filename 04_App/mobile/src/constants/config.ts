// 백엔드 주소. Expo 클라이언트에서 읽을 수 있도록 EXPO_PUBLIC_ 접두사를 사용한다.
//   EXPO_PUBLIC_API_BASE_URL=<backend-url> npx expo start --go --host lan --clear
// 서버에 연결되지 않으면 앱은 더미 결과를 보여주지 않고 오류 화면을 표시합니다.
const runtimeApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

if (!runtimeApiBaseUrl) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is required');
}

export const API_BASE_URL = runtimeApiBaseUrl;
