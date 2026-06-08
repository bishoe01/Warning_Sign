import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image as RNImage, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { localizeAnalysis } from '@/api/contractApi';
import { CautionCard } from '@/components/CautionCard';
import { LanguageTabs } from '@/components/LanguageTabs';
import { SummaryCard } from '@/components/SummaryCard';
import { colors, levelColors, radius, spacing } from '@/constants/theme';
import * as historyStore from '@/data/historyStore';
import { analysisHasLanguage, mergeLocalizedAnalysisPatch } from '@/data/localizationMerge';
import type { CautionItem } from '@/data/sampleAnalysis';
import { session } from '@/data/session';
import { containRect, expandRect, sourceBoxToRect, type Size } from '@/data/sourceLayout';
import { collectPageSourceItems, collectSourceItems, findDefaultSourceItem } from '@/data/sourceViewer';
import { DEFAULT_LANGUAGE, type AppLanguage } from '@/i18n/languages';
import { getLocalized } from '@/i18n/localized';
import { useI18n } from '@/i18n/useI18n';

type SourceViewer = {
  pageIndex: number;
  selectedItem: CautionItem | null;
};

function sourceOverlayFill(level: CautionItem['level'], isSelected: boolean): string {
  if (level === 'check') return isSelected ? 'rgba(224, 49, 49, 0.22)' : 'rgba(224, 49, 49, 0.11)';
  if (level === 'review') return isSelected ? 'rgba(232, 89, 12, 0.22)' : 'rgba(232, 89, 12, 0.11)';
  return isSelected ? 'rgba(49, 130, 246, 0.22)' : 'rgba(49, 130, 246, 0.11)';
}

export default function ResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useI18n();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const fromHistory = !!id;
  const [record, setRecord] = useState<historyStore.HistoryRecord | null>(null);
  const [sessionResult, setSessionResult] = useState(session.getResult());
  const [viewer, setViewer] = useState<SourceViewer | null>(null);
  const [viewerCurrentPage, setViewerCurrentPage] = useState(0);
  const [viewerImageSize, setViewerImageSize] = useState<Size | null>(null);
  const [viewerStageSize, setViewerStageSize] = useState<Size>({ width: 0, height: 0 });
  const [sourcePanelWidth, setSourcePanelWidth] = useState(0);
  const viewerScrollRef = useRef<ScrollView>(null);
  const sourcePanelScrollRef = useRef<ScrollView>(null);
  const viewerImageDragRef = useRef(false);
  const sourcePanelDragRef = useRef(false);
  const { width: windowWidth } = useWindowDimensions();
  const [localizingLanguage, setLocalizingLanguage] = useState<AppLanguage | null>(null);
  const [localizationError, setLocalizationError] = useState<{ language: AppLanguage; message: string } | null>(null);
  const localizingRef = useRef<AppLanguage | null>(null);
  const failedLocalizationRef = useRef<AppLanguage | null>(null);
  const tr = t.result;
  useEffect(() => { if (id) historyStore.get(id).then((r) => (r ? setRecord(r) : router.back())); }, [id, router]);

  const data = fromHistory ? record?.result : sessionResult;
  const imageUris = fromHistory && record ? historyStore.pageUris(record) : session.getImages();
  const languageReady = data ? analysisHasLanguage(data, language) : true;
  const displayLanguage = languageReady ? language : DEFAULT_LANGUAGE;
  const viewerImageUri = viewer ? imageUris[viewerCurrentPage] : null;
  const renderedImageRect = viewerImageSize ? containRect(viewerStageSize, viewerImageSize) : null;
  const sourceItems = useMemo(() => (data ? collectSourceItems(data.cautionItems) : []), [data]);
  const viewerPageItems = useMemo(
    () => (viewer && data ? collectPageSourceItems(data.cautionItems, viewerCurrentPage) : []),
    [data, viewer, viewerCurrentPage],
  );
  const selectedViewerItem = !viewer
    ? null
    : viewer.selectedItem && sourceItems.some((entry) => entry.item === viewer.selectedItem)
      ? viewer.selectedItem
      : (viewerPageItems[0]?.item ?? sourceItems[0]?.item ?? null);

  useEffect(() => {
    if (!viewerImageUri) {
      setViewerImageSize(null);
      return;
    }
    let cancelled = false;
    setViewerImageSize(null);
    RNImage.getSize(
      viewerImageUri,
      (width, height) => { if (!cancelled) setViewerImageSize({ width, height }); },
      () => { if (!cancelled) setViewerImageSize(null); },
    );
    return () => { cancelled = true; };
  }, [viewerImageUri]);

  useEffect(() => {
    if (!data || languageReady || localizingRef.current === language || failedLocalizationRef.current === language) return;

    let cancelled = false;
    localizingRef.current = language;
    setLocalizingLanguage(language);

    void localizeAnalysis(data, language)
      .then(async (patch) => {
        if (cancelled) return;
        const merged = mergeLocalizedAnalysisPatch(data, patch);
        if (failedLocalizationRef.current === language) failedLocalizationRef.current = null;
        setLocalizationError(null);
        if (fromHistory && record) {
          const updated = await historyStore.updateResult(record.id, merged);
          if (!cancelled && updated) setRecord(updated);
        } else {
          session.replaceResult(merged);
          setSessionResult(merged);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          failedLocalizationRef.current = language;
          setLocalizationError({ language, message: err instanceof Error ? err.message : 'localization failed' });
        }
      })
      .finally(() => {
        if (!cancelled) {
          if (localizingRef.current === language) localizingRef.current = null;
          setLocalizingLanguage(null);
        }
      });

    return () => { cancelled = true; };
  }, [data, fromHistory, language, languageReady, record]);

  useEffect(() => {
    if (viewer?.pageIndex == null) return;
    const page = viewer.pageIndex;
    const w = viewerStageSize.width || windowWidth;
    viewerScrollRef.current?.scrollTo({ x: page * w, animated: false });
  }, [viewer?.pageIndex, viewerStageSize.width, windowWidth]);

  useEffect(() => {
    if (!selectedViewerItem || sourcePanelWidth <= 0) return;
    const index = sourceItems.findIndex((entry) => entry.item === selectedViewerItem);
    if (index < 0) return;
    sourcePanelScrollRef.current?.scrollTo({ x: index * sourcePanelWidth, animated: true });
  }, [selectedViewerItem, sourceItems, sourcePanelWidth]);

  // 기록 로딩 중엔 직전 분석(session)이 한 프레임 보이는 깜빡임 방지 (모든 훅 선언 뒤에 위치)
  if (fromHistory && !record) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Feather name="chevron-left" size={26} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{tr.title}</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  const meta = fromHistory ? { isSample: !!record!.isSample, error: null } : session.getResultMeta();
  const isSample = meta.isSample || !!data!.isSample;
  const isLocalizing = !languageReady && localizingLanguage === language;
  const currentLocalizationError = localizationError?.language === language ? localizationError.message : null;
  const openSourceViewer = (item: CautionItem) => {
    const source = item.source;
    if (!source || source.confidence === 'low') return;
    if (!imageUris[source.pageIndex]) return;
    setViewer({ selectedItem: item, pageIndex: source.pageIndex });
    setViewerCurrentPage(source.pageIndex);
  };
  const openImageViewer = (pageIndex: number) => {
    if (!imageUris[pageIndex]) return;
    setViewer({ pageIndex, selectedItem: findDefaultSourceItem(data!.cautionItems, pageIndex) });
    setViewerCurrentPage(pageIndex);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => (fromHistory ? router.back() : router.replace('/'))} hitSlop={10} style={styles.backBtn}>
          <Feather name={fromHistory ? 'chevron-left' : 'home'} size={fromHistory ? 26 : 22} color={colors.text} />
        </Pressable>
          <Text style={styles.headerTitle}>{tr.title}</Text>
        {fromHistory ? (
          <Pressable hitSlop={10} style={styles.backBtn} onPress={() => {
            Alert.alert(tr.deleteTitle, tr.deleteMessage, [
              { text: t.common.cancel, style: 'cancel' },
              { text: t.common.delete, style: 'destructive', onPress: () => historyStore.remove(id!).then(() => router.back()) },
            ]);
          }}>
            <Feather name="trash-2" size={20} color={colors.textTertiary} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {isSample && (
          <View style={styles.sampleNote}>
            <Feather name="alert-triangle" size={15} color="#B45309" />
            <View style={styles.sampleTextWrap}>
              <Text style={styles.sampleTitle}>{tr.sampleTitle}</Text>
              <Text style={styles.sampleDesc}>
                {tr.sampleDesc}{meta.error ? ` (${meta.error})` : ''}
              </Text>
            </View>
          </View>
        )}
        {!fromHistory && (
          <View style={styles.savedNote}>
            <Feather name="check-circle" size={14} color={colors.primary} />
            <Text style={styles.savedNoteText}>{tr.saved}</Text>
          </View>
        )}
        <LanguageTabs value={language} onChange={setLanguage} variant="dropdown" label={t.settings.languageTitle} />

        {!languageReady && (
          <View style={styles.localizationNote}>
            {isLocalizing ? <ActivityIndicator color={colors.primary} size="small" /> : <Feather name="alert-circle" size={15} color="#B45309" />}
            <Text style={styles.localizationText}>
              {isLocalizing
                ? t.loading.simplify
                : `선택한 언어 설명을 불러오지 못해 한국어로 보여드려요. (${currentLocalizationError ?? 'localization failed'})`}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>{tr.summaryTitle}</Text>
        <SummaryCard summary={data!.summary} language={displayLanguage} labels={tr} />

        <View style={styles.cautionHead}>
          <Text style={styles.sectionTitle}>{tr.cautionTitle}</Text>
          <Text style={styles.count}>{data!.cautionItems.length}</Text>
        </View>
        <View style={styles.cautionList}>
          {data!.cautionItems.map((item, index) => (
            <CautionCard
              key={index}
              item={item}
              language={displayLanguage}
              labels={tr}
              canShowSource={imageUris.length > 0}
              onOpenSource={openSourceViewer}
            />
          ))}
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeLabel}>{tr.noticeLabel}</Text>
          <Text style={styles.noticeText}>{getLocalized(data!.notice, displayLanguage)}</Text>
        </View>

        {imageUris.length > 0 && (
          <View style={styles.originalBlock}>
            <Text style={styles.sectionTitle}>{tr.originalImages(imageUris.length)}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {imageUris.map((uri, i) => (
                <Pressable key={uri + i} onPress={() => openImageViewer(i)}>
                  <Image source={{ uri }} style={styles.originalThumb} contentFit="cover" />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <View style={[styles.viewerBackdrop, { paddingTop: insets.top + spacing.sm, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.viewerHeader}>
            <Pressable onPress={() => setViewer(null)} hitSlop={10} style={styles.viewerClose}>
              <Feather name="x" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.viewerTitle}>{viewerPageItems.length > 0 ? tr.sourceViewerTitle : tr.originalImages(imageUris.length)}</Text>
            <Text style={styles.viewerPage}>{viewer ? `${viewerCurrentPage + 1}/${imageUris.length}` : ''}</Text>
          </View>

          <ScrollView
            ref={viewerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            style={styles.viewerCarousel}
            onLayout={(e) => setViewerStageSize(e.nativeEvent.layout)}
            onScrollBeginDrag={() => { viewerImageDragRef.current = true; }}
            onMomentumScrollEnd={(e) => {
              const w = viewerStageSize.width || windowWidth;
              const page = Math.round(e.nativeEvent.contentOffset.x / w);
              const isUserDrag = viewerImageDragRef.current;
              const nextPage = isUserDrag ? page : (viewer?.pageIndex ?? page);
              setViewerCurrentPage(nextPage);
              if (isUserDrag) {
                const nextPageItems = data ? collectPageSourceItems(data.cautionItems, page) : [];
                setViewer((prev) => (prev ? { ...prev, pageIndex: page, selectedItem: nextPageItems[0]?.item ?? null } : prev));
              }
              viewerImageDragRef.current = false;
            }}
          >
            {imageUris.map((uri, i) => (
              <View
                key={`slide-${i}`}
                style={[styles.viewerSlide, { width: viewerStageSize.width || windowWidth }]}
              >
                <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" />
                {i === viewerCurrentPage && renderedImageRect && viewerPageItems.map((entry, itemIndex) => (
                  entry.boxes.map((box, boxIndex) => {
                    const isSelected = entry.item === selectedViewerItem;
                    const rect = expandRect(sourceBoxToRect(box, renderedImageRect), renderedImageRect, {
                      horizontal: isSelected ? 14 : 8,
                      vertical: isSelected ? 11 : 7,
                    });
                    const level = levelColors[entry.item.level].fg;
                    const fill = sourceOverlayFill(entry.item.level, isSelected);
                    return (
                      <Pressable
                        key={`${box.pageIndex}-${itemIndex}-${boxIndex}`}
                        hitSlop={6}
                        onPress={() => setViewer((prev) => (prev ? { ...prev, selectedItem: entry.item } : prev))}
                        style={[
                          styles.sourceHighlight,
                          isSelected ? styles.sourceHighlightActive : styles.sourceHighlightInactive,
                          rect,
                          { borderColor: level, backgroundColor: fill, shadowColor: level },
                        ]}
                      >
                        <View
                          pointerEvents="none"
                          style={[
                            styles.sourceNumberBadge,
                            isSelected ? styles.sourceNumberBadgeActive : styles.sourceNumberBadgeInactive,
                            { borderColor: level, backgroundColor: isSelected ? level : 'rgba(255,255,255,0.92)' },
                          ]}
                        >
                          <Text style={[styles.sourceNumberText, { color: isSelected ? '#fff' : level }]}>
                            {entry.number}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })
                ))}
              </View>
            ))}
          </ScrollView>

          {sourceItems.length > 0 && (
            <View
              style={styles.sourcePanelPager}
              onLayout={(e) => setSourcePanelWidth(e.nativeEvent.layout.width)}
            >
              <ScrollView
                ref={sourcePanelScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                style={styles.sourcePanelScroll}
                onScrollBeginDrag={() => { sourcePanelDragRef.current = true; }}
                onMomentumScrollEnd={(e) => {
                  if (!sourcePanelDragRef.current) return;
                  const width = sourcePanelWidth || windowWidth;
                  const index = Math.round(e.nativeEvent.contentOffset.x / width);
                  const entry = sourceItems[index];
                  if (entry) {
                    setViewer((prev) => (prev ? { ...prev, pageIndex: entry.pageIndex, selectedItem: entry.item } : prev));
                    setViewerCurrentPage(entry.pageIndex);
                  }
                  sourcePanelDragRef.current = false;
                }}
              >
                {sourceItems.map((entry) => {
                  const panelColor = levelColors[entry.item.level].fg;
                  return (
                    <View
                      key={`panel-${entry.number}`}
                      style={[styles.sourcePanel, { width: sourcePanelWidth || windowWidth - spacing.md * 2 }]}
                    >
                      <View style={styles.sourcePanelTitleRow}>
                        <View style={[styles.sourcePanelNumber, { backgroundColor: panelColor }]}>
                          <Text style={styles.sourcePanelNumberText}>{entry.number}</Text>
                        </View>
                        <Text style={styles.sourcePanelTitle}>{getLocalized(entry.item.title, displayLanguage)}</Text>
                      </View>
                      <Text style={styles.sourcePanelLabel}>{tr.sourceQuoteLabel}</Text>
                      <Text style={styles.sourcePanelQuote}>"{entry.item.source?.quote ?? entry.item.originalText}"</Text>
                      <Text style={[styles.sourcePanelHint, { color: panelColor }]}>
                        {entry.item.source?.confidence === 'medium' ? tr.sourceLowConfidence : tr.sourceUsedHint}
                      </Text>
                      <Text style={styles.sourcePanelExplanation}>{getLocalized(entry.item.explanation, displayLanguage)}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  cautionHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: spacing.sm },
  count: { fontSize: 17, fontWeight: '800', color: colors.primary },
  cautionList: { gap: spacing.md },
  notice: { marginTop: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: 4 },
  noticeLabel: { fontSize: 11, fontWeight: '800', color: colors.textTertiary },
  noticeText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  savedNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primarySoft,
    borderRadius: radius.md, paddingVertical: 9, paddingHorizontal: spacing.md },
  savedNoteText: { flex: 1, fontSize: 12, color: colors.primary, fontWeight: '700' },
  localizationNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface,
    borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: spacing.md },
  localizationText: { flex: 1, fontSize: 12, color: colors.textSecondary, fontWeight: '700', lineHeight: 17 },
  sampleNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFF7ED',
    borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: spacing.md },
  sampleTextWrap: { flex: 1, gap: 2 },
  sampleTitle: { fontSize: 12, color: '#92400E', fontWeight: '900' },
  sampleDesc: { fontSize: 12, color: '#92400E', fontWeight: '600', lineHeight: 17 },
  originalBlock: { marginTop: spacing.sm, gap: spacing.sm },
  originalThumb: { width: 92, height: 124, borderRadius: radius.md, backgroundColor: colors.bgElevated },
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)' },
  viewerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.md, paddingHorizontal: spacing.md },
  viewerClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  viewerTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '800' },
  viewerPage: { color: 'rgba(255,255,255,0.74)', fontSize: 13, fontWeight: '800' },
  viewerCarousel: { flex: 1 },
  viewerSlide: { flex: 1, overflow: 'hidden' },
  sourceHighlight: {
    position: 'absolute',
    borderRadius: 7,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
  },
  sourceHighlightActive: {
    borderWidth: 2.5,
    shadowOpacity: 0.22,
    zIndex: 3,
  },
  sourceHighlightInactive: {
    borderWidth: 1.5,
    shadowOpacity: 0.12,
    zIndex: 1,
  },
  sourceNumberBadge: {
    position: 'absolute',
    top: -11,
    left: -11,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  sourceNumberBadgeActive: {
    borderWidth: 0,
  },
  sourceNumberBadgeInactive: {
    borderWidth: 1.5,
  },
  sourceNumberText: { fontSize: 12, fontWeight: '900' },
  sourcePanelPager: { marginTop: spacing.md, marginHorizontal: spacing.md },
  sourcePanelScroll: { borderRadius: radius.lg },
  sourcePanel: { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.lg, gap: 6 },
  sourcePanelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sourcePanelNumber: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.text,
  },
  sourcePanelNumberText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  sourcePanelTitle: { flex: 1, fontSize: 15, fontWeight: '900', color: colors.text, lineHeight: 20 },
  sourcePanelLabel: { fontSize: 11, fontWeight: '800', color: colors.textTertiary, marginTop: 4 },
  sourcePanelQuote: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, fontWeight: '700' },
  sourcePanelHint: { fontSize: 12, color: colors.primary, lineHeight: 18, fontWeight: '800' },
  sourcePanelExplanation: { fontSize: 13, color: colors.text, lineHeight: 20, fontWeight: '500' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
