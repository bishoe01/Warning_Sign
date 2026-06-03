// 백엔드 주소. 실기기(Expo Go) 테스트에서는 실행할 때 PC 의 접속 가능한 IP 를 넘긴다.
//   EXPO_PUBLIC_API_BASE_URL=http://192.168.0.10:8000 npx expo start --go --host lan --clear
// 서버에 연결되지 않으면 앱은 더미 결과를 보여주지 않고 오류 화면을 표시합니다.
const runtimeApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL =
  runtimeApiBaseUrl && runtimeApiBaseUrl.length > 0
    ? runtimeApiBaseUrl
    : 'http://192.168.4.37:8000';
