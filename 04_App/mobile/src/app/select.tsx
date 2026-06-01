import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing } from '@/constants/theme';
import { session } from '@/data/session';

export default function CaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [pages, setPages] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null); // 크게 보기 모달
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
      if (photo?.uri) setPages((p) => [...p, photo.uri]);
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
    if (!result.canceled) setPages((p) => [...p, ...result.assets.map((a) => a.uri)]);
  };

  const removePage = (i: number) => setPages((p) => p.filter((_, idx) => idx !== i));

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

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <Header
        insetTop={0}
        onBack={() => router.back()}
        torch={torch}
        onTorch={permission.granted ? () => setTorch((v) => !v) : undefined}
      />

      <Text style={styles.hint}>
        {pages.length === 0
          ? '계약서를 네모 칸에 꽉 차게 맞춰 주세요'
          : `${pages.length}장 추가됨 · 다음 장을 찍거나 분석을 시작하세요`}
      </Text>

      <View style={styles.frameWrap}>
        <View style={styles.frame} onLayout={(e) => setFrameH(e.nativeEvent.layout.height)}>
          {permission.granted && (
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
        {pages.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}
            contentContainerStyle={styles.stripContent}>
            {pages.map((uri, i) => (
              <Pressable key={uri + i} style={styles.thumbWrap} onPress={() => setPreview(uri)}>
                <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                <Text style={styles.thumbNum}>{i + 1}</Text>
                <Pressable hitSlop={8} style={styles.thumbDel} onPress={() => removePage(i)}>
                  <Feather name="x" size={12} color={colors.white} />
                </Pressable>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.shutterRow}>
          <Pressable style={({ pressed }) => [styles.sideButton, pressed && styles.pressed]}
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

        {pages.length > 0 && (
          <Pressable style={({ pressed }) => [styles.analyzeButton, shadow.button, pressed && styles.pressed]}
            onPress={analyze}>
            <Text style={styles.analyzeText}>분석하기 ({pages.length}장)</Text>
          </Pressable>
        )}
        {pages.length > 0 && (
          <Text style={styles.tip}>썸네일을 탭하면 크게 볼 수 있고, ×로 지울 수 있어요</Text>
        )}
      </View>

      {pages.length === 0 && (
        <Text style={[styles.tip, { paddingBottom: insets.bottom + spacing.md }]}>
          그림자 없이 글자가 또렷하게 나오도록 맞춰 주세요
        </Text>
      )}

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreview(null)}>
          {preview && <Image source={{ uri: preview }} style={styles.previewImg} resizeMode="contain" />}
        </Pressable>
      </Modal>
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

  analyzeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    marginTop: spacing.md,
  },
  analyzeText: { color: colors.white, fontSize: 16, fontWeight: '800' },

  strip: { maxHeight: 76, marginBottom: spacing.md },
  stripContent: { gap: spacing.sm, paddingHorizontal: 2 },
  thumbWrap: { width: 54, height: 70, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.cameraSurface },
  thumb: { width: '100%', height: '100%' },
  thumbNum: { position: 'absolute', left: 3, bottom: 3, fontSize: 10, fontWeight: '800', color: colors.white,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 4, borderRadius: 4, overflow: 'hidden' },
  thumbDel: { position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  previewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  previewImg: { width: '100%', height: '80%' },

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
