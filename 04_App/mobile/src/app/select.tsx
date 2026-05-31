import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing } from '@/constants/theme';
import { session } from '@/data/session';

export default function CaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);

  // 스캔 라인 위아래 이동 애니메이션 (라이브 모드에서만)
  const scanY = useRef(new Animated.Value(0)).current;
  const [frameH, setFrameH] = useState(0);
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

  const takePhoto = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.9 });
      if (photo?.uri) setPhotoUri(photo.uri);
    } finally {
      setBusy(false);
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const analyze = () => {
    if (!photoUri) return;
    session.setImage(photoUri);
    router.push('/loading');
  };

  // --- 권한 로딩/거부 상태 ---
  if (!permission) {
    return <View style={styles.root} />;
  }
  if (!permission.granted && !photoUri) {
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

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <Header
        insetTop={0}
        onBack={() => router.back()}
        torch={torch}
        onTorch={photoUri ? undefined : () => setTorch((v) => !v)}
      />

      <Text style={styles.hint}>
        {photoUri ? '이 사진으로 분석할까요?' : '계약서를 네모 칸에 꽉 차게 맞춰 주세요'}
      </Text>

      <View style={styles.frameWrap}>
        <View style={styles.frame} onLayout={(e) => setFrameH(e.nativeEvent.layout.height)}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.fill} resizeMode="cover" />
          ) : (
            <>
              <CameraView ref={cameraRef} style={styles.fill} facing="back" enableTorch={torch} />
              <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
            </>
          )}
          <View style={[styles.corner, styles.cTL]} />
          <View style={[styles.corner, styles.cTR]} />
          <View style={[styles.corner, styles.cBL]} />
          <View style={[styles.corner, styles.cBR]} />
        </View>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.sm }]}>
        {photoUri ? (
          <View style={styles.confirmRow}>
            <Pressable
              style={({ pressed }) => [styles.retakeButton, pressed && styles.pressed]}
              onPress={() => setPhotoUri(null)}>
              <Feather name="rotate-ccw" size={17} color={colors.white} />
              <Text style={styles.retakeText}>다시 찍기</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.analyzeButton, shadow.button, pressed && styles.pressed]}
              onPress={analyze}>
              <Text style={styles.analyzeText}>분석하기</Text>
            </Pressable>
          </View>
        ) : (
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
            <View style={styles.sideButton} />
          </View>
        )}
      </View>

      {!photoUri && (
        <Text style={[styles.tip, { paddingBottom: insets.bottom + spacing.md }]}>
          그림자 없이 글자가 또렷하게 나오도록 맞춰 주세요
        </Text>
      )}
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
  corner: { position: 'absolute', width: BRACKET, height: BRACKET, borderColor: colors.primary },
  cTL: { top: 12, left: 12, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  cTR: { top: 12, right: 12, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  cBL: { bottom: 12, left: 12, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  cBR: { bottom: 12, right: 12, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },

  controls: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl },
  shutterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: colors.cameraSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
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

  confirmRow: { flexDirection: 'row', gap: spacing.md },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.cameraSurface,
  },
  retakeText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  analyzeButton: {
    flex: 1,
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
