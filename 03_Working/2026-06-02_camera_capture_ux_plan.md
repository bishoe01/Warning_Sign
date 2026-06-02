# Camera Capture UX 개편 구현계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 촬영 화면을 "촬영 ↔ 검토" 2모드로 바꿔, 카메라가 화면 이탈/검토 중엔 꺼지고(①), 갤러리로 고르면 라이브 카메라 대신 추가한 장들의 캐러셀을 보여준다(②).

**Architecture:** `select.tsx` 단일 파일 개편. `mode: 'capture'|'review'` 상태 추가. 카메라 `active = focused && mode==='capture'`(expo-camera `active` prop + expo-router `useFocusEffect`로 포커스 추적). 검토 모드 = 페이지 가로 페이징 캐러셀. 갤러리 추가 시 자동 검토 모드. 기존 fullscreen preview 모달 제거.

**Tech Stack:** React Native + Expo SDK 56, expo-router(useFocusEffect), expo-camera(CameraView.active), expo-image-picker, RN ScrollView(pagingEnabled).

**설계 근거:** `03_Working/2026-06-02_camera_capture_ux_spec.md`

> **검증 방식:** 자동 테스트 러너 없음(프로젝트 결정). **`tsc --noEmit` + 시뮬레이터/실기기 수동 + 커밋**으로 검증. 카메라 active(①)는 실기기에서만 사용 표시등으로 확인 가능, 캐러셀/모드 전환은 시뮬레이터(갤러리)로 확인.

---

## 파일 구조

| 파일 | 변경 | 책임 |
|---|---|---|
| `04_App/mobile/src/app/select.tsx` | 수정(전체 교체) | 촬영 화면 — 2모드(촬영/검토), 카메라 active 게이팅, 페이지 캐러셀 |

다른 파일 변경 없음. `session.setImages(pages)` 시그니처·`/loading` 라우트는 현행 그대로 사용.

---

## Task 1: select.tsx 2모드 개편

**Files:** Modify `04_App/mobile/src/app/select.tsx` (전체 내용 교체)

> 단일 화면의 응집적 개편이라 단계 분할 대신 **전체 파일 교체**로 둔다(중간 상태는 테스트 러너 없이 독립 검증 불가). Step 1에서 아래 전체 코드로 교체한 뒤 tsc·수동으로 검증한다.

- [ ] **Step 1: `select.tsx` 전체를 아래로 교체**

```tsx
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing } from '@/constants/theme';
import { session } from '@/data/session';

type Mode = 'capture' | 'review';

export default function CaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const carouselRef = useRef<ScrollView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [pages, setPages] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>('capture');
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [frameW, setFrameW] = useState(0);
  const [frameH, setFrameH] = useState(0);

  // 카메라는 화면이 포커스됐고 촬영 모드일 때만 active (이탈/검토 시 해제 → ①)
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  // 스캔 라인 애니메이션
  const scanY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(scanY, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scanY]);

  const goReview = (index: number) => {
    setReviewIndex(index);
    setMode('review');
  };

  const takePhoto = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.9 });
      if (photo?.uri) setPages((p) => [...p, photo.uri]); // 촬영 모드 유지(연속 촬영)
    } finally {
      setBusy(false);
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (result.canceled) return;
    const added = result.assets.map((a) => a.uri);
    setPages((p) => {
      const next = [...p, ...added];
      const firstNew = next.length - added.length;
      setReviewIndex(firstNew);
      requestAnimationFrame(() => carouselRef.current?.scrollTo({ x: firstNew * frameW, animated: false }));
      return next;
    });
    setMode('review'); // 갤러리로 고르면 검토 모드 → 라이브 카메라 사라짐(②)
  };

  const removeCurrent = () => {
    const i = reviewIndex;
    setPages((p) => {
      const next = p.filter((_, idx) => idx !== i);
      if (next.length === 0) {
        setMode('capture'); // 다 지우면 촬영 모드 복귀
        return next;
      }
      const newIndex = Math.min(i, next.length - 1);
      setReviewIndex(newIndex);
      requestAnimationFrame(() => carouselRef.current?.scrollTo({ x: newIndex * frameW, animated: false }));
      return next;
    });
  };

  const analyze = () => {
    if (pages.length === 0) return;
    session.setImages(pages);
    router.push('/loading');
  };

  // --- 권한 로딩/거부 상태 ---
  if (!permission) {
    return <View style={styles.root} />;
  }
  if (!permission.granted && pages.length === 0) {
    return (
      <View style={[styles.root, styles.permWrap, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar style="light" />
        <Header insetTop={insets.top} onBack={() => router.back()} torch={false} onTorch={undefined} />
        <View style={styles.permCard}>
          <View style={styles.permIcon}>
            <Feather name="camera" size={26} color={colors.primary} />
          </View>
          <Text style={styles.permTitle}>카메라 권한이 필요해요</Text>
          <Text style={styles.permDesc}>계약서를 촬영해 분석하려면 카메라 접근을 허용해 주세요.</Text>
          <Pressable
            style={({ pressed }) => [styles.permButton, pressed && styles.pressed]}
            onPress={requestPermission}>
            <Text style={styles.permButtonText}>카메라 권한 허용</Text>
          </Pressable>
          <Pressable onPress={pickFromGallery} hitSlop={8}>
            <Text style={styles.permGallery}>갤러리에서 선택</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const translateY = scanY.interpolate({
    inputRange: [0, 1],
    outputRange: [14, Math.max(14, frameH - 18)],
  });
  const cameraActive = focused && mode === 'capture' && permission.granted;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <Header
        insetTop={0}
        onBack={() => router.back()}
        torch={torch}
        onTorch={mode === 'capture' && permission.granted ? () => setTorch((v) => !v) : undefined}
      />

      <Text style={styles.hint}>
        {mode === 'review'
          ? `${pages.length}장 · 넘겨서 확인하세요`
          : pages.length === 0
            ? '계약서를 네모 칸에 꽉 차게 맞춰 주세요'
            : `${pages.length}장 추가됨 · 다음 장을 찍거나 검토하세요`}
      </Text>

      <View style={styles.frameWrap}>
        <View
          style={styles.frame}
          onLayout={(e) => {
            setFrameH(e.nativeEvent.layout.height);
            setFrameW(e.nativeEvent.layout.width);
          }}>
          {mode === 'capture'
            ? permission.granted && (
                <>
                  <CameraView
                    ref={cameraRef}
                    style={styles.fill}
                    facing="back"
                    enableTorch={torch}
                    active={cameraActive}
                  />
                  <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
                </>
              )
            : frameW > 0 && (
                <>
                  <ScrollView
                    ref={carouselRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    contentOffset={{ x: reviewIndex * frameW, y: 0 }}
                    onMomentumScrollEnd={(e) =>
                      setReviewIndex(Math.round(e.nativeEvent.contentOffset.x / frameW))
                    }>
                    {pages.map((uri, i) => (
                      <Image
                        key={uri + i}
                        source={{ uri }}
                        style={{ width: frameW, height: '100%' }}
                        resizeMode="contain"
                      />
                    ))}
                  </ScrollView>
                  <Text style={styles.pageIndicator}>
                    {reviewIndex + 1} / {pages.length}
                  </Text>
                  <Pressable style={styles.reviewDel} hitSlop={8} onPress={removeCurrent}>
                    <Feather name="trash-2" size={16} color={colors.white} />
                  </Pressable>
                </>
              )}
          <View style={[styles.corner, styles.cTL]} />
          <View style={[styles.corner, styles.cTR]} />
          <View style={[styles.corner, styles.cBL]} />
          <View style={[styles.corner, styles.cBR]} />
        </View>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.sm }]}>
        {mode === 'capture' ? (
          <>
            {pages.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.strip}
                contentContainerStyle={styles.stripContent}>
                {pages.map((uri, i) => (
                  <Pressable key={uri + i} style={styles.thumbWrap} onPress={() => goReview(i)}>
                    <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                    <Text style={styles.thumbNum}>{i + 1}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <View style={styles.shutterRow}>
              <Pressable
                style={({ pressed }) => [styles.sideButton, pressed && styles.pressed]}
                onPress={pickFromGallery}>
                <Feather name="image" size={22} color={colors.cameraTextDim} />
              </Pressable>
              <Pressable onPress={takePhoto} disabled={busy} hitSlop={12}>
                {({ pressed }) => (
                  <View style={[styles.shutterOuter, pressed && { transform: [{ scale: 0.93 }] }]}>
                    <View style={styles.shutterInner} />
                  </View>
                )}
              </Pressable>
              {pages.length > 0 ? (
                <Pressable
                  style={({ pressed }) => [styles.reviewChip, pressed && styles.pressed]}
                  onPress={() => goReview(pages.length - 1)}>
                  <Text style={styles.reviewChipText}>검토 {pages.length}</Text>
                </Pressable>
              ) : (
                <View style={styles.sideButton} />
              )}
            </View>
            {pages.length === 0 && (
              <Text style={styles.tip}>그림자 없이 글자가 또렷하게 나오도록 맞춰 주세요</Text>
            )}
          </>
        ) : (
          <>
            <View style={styles.reviewActions}>
              <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                onPress={() => setMode('capture')}>
                <Feather name="camera" size={18} color={colors.white} />
                <Text style={styles.secondaryText}>촬영</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                onPress={pickFromGallery}>
                <Feather name="image" size={18} color={colors.white} />
                <Text style={styles.secondaryText}>갤러리</Text>
              </Pressable>
            </View>
            <Pressable
              style={({ pressed }) => [styles.analyzeButton, shadow.button, pressed && styles.pressed]}
              onPress={analyze}>
              <Text style={styles.analyzeText}>분석하기 ({pages.length}장)</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function Header({
  insetTop,
  onBack,
  torch,
  onTorch,
}: {
  insetTop: number;
  onBack: () => void;
  torch: boolean;
  onTorch?: () => void;
}) {
  return (
    <View style={[styles.header, { paddingTop: insetTop + spacing.sm }]}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.headerBtn}>
        <Feather name="chevron-left" size={26} color={colors.white} />
      </Pressable>
      <Text style={styles.headerTitle}>계약서 촬영</Text>
      <View style={styles.headerSpacer} />
      {onTorch ? (
        <Pressable onPress={onTorch} hitSlop={10} style={[styles.flashBtn, torch && styles.flashOn]}>
          <Feather name="zap" size={17} color={torch ? colors.text : colors.white} />
        </Pressable>
      ) : (
        <View style={styles.headerBtn} />
      )}
    </View>
  );
}

const BRACKET = 32;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cameraBg },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  headerBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.white, marginLeft: spacing.sm },
  headerSpacer: { flex: 1 },
  flashBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashOn: { backgroundColor: '#FFD43B' },

  hint: { textAlign: 'center', fontSize: 13, color: colors.cameraTextDim, paddingVertical: spacing.md },

  frameWrap: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  frame: {
    width: '100%',
    aspectRatio: 210 / 297,
    borderRadius: 18,
    backgroundColor: colors.cameraField,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: '7%',
    right: '7%',
    height: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  pageIndicator: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  reviewDel: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: { position: 'absolute', width: BRACKET, height: BRACKET, borderColor: colors.primary },
  cTL: { top: 12, left: 12, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  cTR: { top: 12, right: 12, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  cBL: { bottom: 12, left: 12, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  cBR: { bottom: 12, right: 12, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },

  controls: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl },
  strip: { maxHeight: 76, marginBottom: spacing.md },
  stripContent: { gap: spacing.sm, paddingHorizontal: 2 },
  thumbWrap: { width: 54, height: 70, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.cameraSurface },
  thumb: { width: '100%', height: '100%' },
  thumbNum: {
    position: 'absolute',
    left: 3,
    bottom: 3,
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  shutterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: colors.cameraSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewChip: {
    minWidth: 48,
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: colors.cameraSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewChipText: { fontSize: 12, fontWeight: '800', color: colors.cameraTextDim },
  shutterOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.white },

  reviewActions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.cameraSurface,
  },
  secondaryText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  analyzeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  analyzeText: { color: colors.white, fontSize: 16, fontWeight: '800' },

  tip: { textAlign: 'center', fontSize: 11, color: colors.textTertiary, paddingTop: spacing.md, paddingHorizontal: spacing.xl },

  pressed: { opacity: 0.85 },

  // 권한 화면
  permWrap: { paddingHorizontal: spacing.xl },
  permCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  permIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  permTitle: { fontSize: 19, fontWeight: '800', color: colors.white },
  permDesc: { fontSize: 14, color: colors.cameraTextDim, textAlign: 'center', lineHeight: 21, paddingHorizontal: spacing.lg },
  permButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: spacing.xxxl,
    borderRadius: radius.lg,
  },
  permButtonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  permGallery: { color: colors.cameraTextDim, fontSize: 14, fontWeight: '600', marginTop: spacing.sm, textDecorationLine: 'underline' },
});
```

- [ ] **Step 2: 타입체크**

Run: `cd 04_App/mobile && npx tsc --noEmit`
Expected: 에러 없음. (특히 `useFocusEffect`(expo-router), `CameraView active` prop, `carouselRef.current?.scrollTo`, `Mode` 유니온이 통과해야 함. `photoUri`/`preview`/`Modal` 같은 잔여 참조 0개.)

- [ ] **Step 3: 수동 확인**

시뮬레이터(카메라 없음 → 갤러리 경로):
- 홈 → 촬영 화면 → 컨트롤 왼쪽 🖼(갤러리)로 2장 선택 → **자동 검토 모드**: 큰 프레임에 캐러셀, "1 / 2" 인디케이터, 좌우 스와이프로 넘김, 우상단 🗑로 현재 장 삭제 → "분석하기 (N장)".
- 검토 모드에서 "촬영" 버튼 → 촬영 모드(큰 프레임이 카메라 자리). "갤러리"로 더 추가 → 검토.
- 모든 장 삭제 → 촬영 모드 복귀.

실기기(카메라):
- 연속 촬영(셔터 여러 번) → 촬영 모드 유지, 하단 썸네일 스트립에 1·2·3. "검토 N" 버튼 → 캐러셀.
- 검토 모드로 가거나 loading/result로 이동하면 **카메라 사용 표시등(초록 점)이 꺼지는지** 확인(① 핵심).
- 캐러셀 스와이프·인디케이터·삭제, 갤러리 추가 후 캐러셀 위치 확인(🟡 아래).

> 🟡 **구현 중 확인:** 캐러셀 인덱스 동기화 — `contentOffset`(마운트 시 초기), `scrollTo`(갤러리 추가·삭제 후 `requestAnimationFrame`). iOS/Android에서 삭제·추가 후 캐러셀이 올바른 장을 보이는지 실측. 어긋나면 `FlatList`(horizontal·pagingEnabled·getItemLayout) 또는 `scrollTo` 타이밍 조정.

- [ ] **Step 4: 커밋**

```bash
cd /Users/bishoe01/Documents/05_DLAB/05_Project
git add 04_App/mobile/src/app/select.tsx
git commit -m "feat(camera-ux): capture/review modes + carousel + active gating

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## 마무리 검증

- [ ] `cd 04_App/mobile && npx tsc --noEmit` 통과
- [ ] iOS 번들 통과(`npx expo export --platform ios` 또는 시뮬레이터 실행)
- [ ] 위 Step 3 수동 흐름(시뮬레이터 갤러리 + 실기기 카메라) 통과 — 특히 카메라 active 해제(①)·갤러리 시 캐러셀(②)

---

## Self-Review (spec 대비)

- **spec ① 화면 이탈 시 해제** → `active = focused && mode==='capture'` (`useFocusEffect`로 focused 토글) ✓
- **spec ② 갤러리 시 라이브 카메라 안 보임** → `pickFromGallery`가 `setMode('review')`, 검토 모드는 CameraView 미렌더 ✓
- **촬영 모드**(카메라+스캔라인, 연속 촬영, 썸네일 스트립, 검토 N 버튼) ✓ / **검토 모드**(캐러셀+인디케이터+삭제, ＋촬영/갤러리/분석하기) ✓
- **갤러리 추가 시 검토 전환·0장이면 촬영 복귀** ✓ / **fullscreen 모달 제거**(preview 상태·스타일 삭제) ✓ / **권한 게이팅 유지** ✓
- **분석하기는 검토 모드** ✓ (spec과 일치)
- **타입 일관성**: `Mode` 유니온, `session.setImages(pages)`(현행), `goReview/removeCurrent/takePhoto/pickFromGallery/analyze` — 시그니처 일관. 잔여 `photoUri`/`preview`/`Modal` 없음(Step 2 tsc로 검증).
- **placeholder 없음**: 전 코드 실제 내용. 🟡(캐러셀 동기화)는 동작 검증 포인트로 명시.

## 범위 밖 (다음 — UX 검수 백로그 / Phase 9)
- 앱 전역 언어 전환(껍데기 한국어 전용), 결과 값 다국어, 기본 언어 기억 → **마이페이지/Phase 9**.
- 목록 개별 삭제 발견성(스와이프 보조), 로딩 실제 진행감, 목록 정보 밀도 → 폴리시 백로그. (`2026-06-02_phase9_마이페이지_방향.md` 참고)
