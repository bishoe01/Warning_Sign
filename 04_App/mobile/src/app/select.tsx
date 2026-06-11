import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing } from '@/constants/theme';
import { CONTRACT_TYPES, DEFAULT_CONTRACT_TYPE, type ContractType } from '@/data/contractType';
import { session } from '@/data/session';
import type { Translation } from '@/i18n/translations';
import { useI18n } from '@/i18n/useI18n';

type Mode = 'capture' | 'review';

const OCR_IMAGE_MAX_WIDTH = 1600;
const OCR_IMAGE_QUALITY = 0.72;

const clampIndex = (index: number, length: number) => {
  if (length <= 0) return 0;
  return Math.min(Math.max(index, 0), length - 1);
};

async function prepareContractImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: OCR_IMAGE_MAX_WIDTH } }],
    {
      compress: OCR_IMAGE_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );
  return result.uri;
}

export default function CaptureScreen() {
  const router = useRouter();
  const { t } = useI18n();
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
  const [contractType, setContractType] = useState<ContractType>(DEFAULT_CONTRACT_TYPE);
  const [recordTitle, setRecordTitle] = useState('');

  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

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

  useEffect(() => {
    setReviewIndex((i) => clampIndex(i, pages.length));
    if (pages.length === 0 && mode === 'review') setMode('capture');
  }, [mode, pages.length]);

  const goReview = (index: number) => {
    setReviewIndex(clampIndex(index, pages.length));
    setMode('review');
  };

  const enterCapture = async () => {
    if (permission?.granted) {
      setMode('capture');
      return;
    }
    const nextPermission = await requestPermission();
    if (nextPermission.granted) setMode('capture');
  };

  const takePhoto = async () => {
    if (busy || !permission?.granted) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.78 });
      if (photo?.uri) {
        const preparedUri = await prepareContractImage(photo.uri);
        setPages((p) => [...p, preparedUri]);
      }
    } finally {
      setBusy(false);
    }
  };

  const pickFromGallery = async () => {
    if (busy) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (result.canceled) return;
      const added = await Promise.all(result.assets.map((a) => prepareContractImage(a.uri)));
      setPages((p) => {
        const next = [...p, ...added];
        const firstNew = next.length - added.length;
        const nextIndex = clampIndex(firstNew, next.length);
        setReviewIndex(nextIndex);
        requestAnimationFrame(() => carouselRef.current?.scrollTo({ x: firstNew * frameW, animated: false }));
        return next;
      });
      setMode('review');
    } finally {
      setBusy(false);
    }
  };

  const removeCurrent = () => {
    const i = clampIndex(reviewIndex, pages.length);
    setPages((p) => {
      const next = p.filter((_, idx) => idx !== i);
      if (next.length === 0) {
        setMode('capture');
        return next;
      }
      const newIndex = clampIndex(i, next.length);
      setReviewIndex(newIndex);
      requestAnimationFrame(() => carouselRef.current?.scrollTo({ x: newIndex * frameW, animated: false }));
      return next;
    });
  };

  const analyze = () => {
    if (pages.length === 0) return;
    session.setImages(pages);
    session.setContractType(contractType);
    session.setRecordTitle(recordTitle);
    router.push('/loading');
  };

  if (!permission) {
    return <View style={styles.root} />;
  }
  if (!permission.granted && pages.length === 0) {
    return (
      <View style={[styles.root, styles.permWrap, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar style="light" />
        <Header insetTop={insets.top} onBack={() => router.back()} torch={false} onTorch={undefined} labels={t.select} />
        <View style={styles.permCard}>
          <View style={styles.permIcon}>
            <Feather name="camera" size={26} color={colors.primary} />
          </View>
          <Text style={styles.permTitle}>{t.select.permissionTitle}</Text>
          <Text style={styles.permDesc}>{t.select.permissionDesc}</Text>
          <Pressable
            style={({ pressed }) => [styles.permButton, pressed && styles.pressed]}
            onPress={requestPermission}>
            <Text style={styles.permButtonText}>{t.select.allowCamera}</Text>
          </Pressable>
          <Pressable onPress={pickFromGallery} hitSlop={8}>
            <Text style={styles.permGallery}>{t.select.gallery}</Text>
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
  const safeReviewIndex = clampIndex(reviewIndex, pages.length);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <Header
        insetTop={0}
        onBack={() => router.back()}
        torch={torch}
        onTorch={mode === 'capture' && permission.granted ? () => setTorch((v) => !v) : undefined}
        labels={t.select}
      />

      <Text style={styles.hint}>
        {mode === 'review'
          ? t.select.reviewHint(pages.length)
          : pages.length === 0
            ? t.select.emptyHint
            : t.select.addedHint(pages.length)}
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
                    contentOffset={{ x: safeReviewIndex * frameW, y: 0 }}
                    onMomentumScrollEnd={(e) => {
                      const nextIndex = clampIndex(
                        Math.round(e.nativeEvent.contentOffset.x / frameW),
                        pages.length,
                      );
                      setReviewIndex(nextIndex);
                      if (nextIndex !== reviewIndex) {
                        carouselRef.current?.scrollTo({ x: nextIndex * frameW, animated: true });
                      }
                    }}>
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
                    {safeReviewIndex + 1} / {pages.length}
                  </Text>
                  <Pressable style={styles.reviewDel} hitSlop={8} onPress={removeCurrent}>
                    <Feather name="trash-2" size={16} color={colors.white} />
                  </Pressable>
                </>
              )}
          <View pointerEvents="none" style={[styles.corner, styles.cTL]} />
          <View pointerEvents="none" style={[styles.corner, styles.cTR]} />
          <View pointerEvents="none" style={[styles.corner, styles.cBL]} />
          <View pointerEvents="none" style={[styles.corner, styles.cBR]} />
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
                disabled={busy}
                onPress={pickFromGallery}>
                <Feather name="image" size={22} color={colors.cameraTextDim} />
              </Pressable>
              <Pressable onPress={takePhoto} disabled={busy || !permission.granted} hitSlop={12}>
                {({ pressed }) => (
                  <View
                    style={[
                      styles.shutterOuter,
                      !permission.granted && styles.shutterDisabled,
                      pressed && permission.granted && { transform: [{ scale: 0.93 }] },
                    ]}>
                    <View style={styles.shutterInner} />
                  </View>
                )}
              </Pressable>
              {pages.length > 0 ? (
                <Pressable
                  style={({ pressed }) => [styles.reviewChip, pressed && styles.pressed]}
                  onPress={() => goReview(pages.length - 1)}>
                  <Text style={styles.reviewChipText}>{t.select.review(pages.length)}</Text>
                </Pressable>
              ) : (
                <View style={styles.sideButton} />
              )}
            </View>
            {pages.length === 0 && (
              <Text style={styles.tip}>{t.select.tip}</Text>
            )}
          </>
        ) : (
          <>
            <View style={styles.reviewActions}>
              <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                onPress={enterCapture}>
                <Feather name="camera" size={18} color={colors.white} />
                <Text style={styles.secondaryText}>{permission.granted ? t.select.camera : t.select.cameraPermission}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                disabled={busy}
                onPress={pickFromGallery}>
                <Feather name="image" size={18} color={colors.white} />
                <Text style={styles.secondaryText}>{t.select.gallery}</Text>
              </Pressable>
            </View>
            <View style={styles.contractTypeBox}>
              <Text style={styles.contractTypeTitle}>{t.select.contractTypeTitle}</Text>
              <View style={styles.contractTypeOptions}>
                {CONTRACT_TYPES.map((option) => {
                  const selected = contractType === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[styles.contractTypeOption, selected && styles.contractTypeOptionSelected]}
                      onPress={() => setContractType(option.value)}>
                      <Text style={[styles.contractTypeText, selected && styles.contractTypeTextSelected]}>
                        {t.select.contractTypes[option.labelKey]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.contractTypeHint}>{t.select.contractTypeHint}</Text>
            </View>
            <View style={styles.recordTitleBox}>
              <Text style={styles.contractTypeTitle}>{t.select.recordTitleLabel}</Text>
              <TextInput
                value={recordTitle}
                onChangeText={setRecordTitle}
                placeholder={t.select.recordTitlePlaceholder}
                placeholderTextColor={colors.cameraTextDim}
                maxLength={48}
                returnKeyType="done"
                style={styles.recordTitleInput}
              />
              <Text style={styles.contractTypeHint}>{t.select.recordTitleHint}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.analyzeButton, shadow.button, pressed && styles.pressed]}
              onPress={analyze}>
              <Text style={styles.analyzeText}>{t.select.analyze(pages.length)}</Text>
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
  labels,
}: {
  insetTop: number;
  onBack: () => void;
  torch: boolean;
  onTorch?: () => void;
  labels: Translation['select'];
}) {
  return (
    <View style={[styles.header, { paddingTop: insetTop + spacing.sm }]}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.headerBtn}>
        <Feather name="chevron-left" size={26} color={colors.white} />
      </Pressable>
      <Text style={styles.headerTitle}>{labels.title}</Text>
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
    zIndex: 2,
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
  shutterDisabled: { opacity: 0.35 },

  reviewActions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  contractTypeBox: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.md,
  },
  contractTypeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },
  contractTypeOptions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  contractTypeOption: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  contractTypeOptionSelected: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  contractTypeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.cameraTextDim,
    textAlign: 'center',
    lineHeight: 17,
  },
  contractTypeTextSelected: {
    color: colors.text,
  },
  contractTypeHint: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.cameraTextDim,
    lineHeight: 16,
  },
  recordTitleBox: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.md,
  },
  recordTitleInput: {
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
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
