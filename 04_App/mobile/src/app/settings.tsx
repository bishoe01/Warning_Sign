import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguageTabs } from '@/components/LanguageTabs';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import { useI18n } from '@/i18n/useI18n';

export default function SettingsScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useI18n();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.settings.title}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={styles.iconBox}>
              <Feather name="globe" size={18} color={colors.primary} />
            </View>
            <View style={styles.sectionText}>
              <Text style={styles.sectionTitle}>{t.settings.languageTitle}</Text>
              <Text style={styles.sectionDesc}>{t.settings.languageDesc}</Text>
            </View>
          </View>
          <LanguageTabs value={language} onChange={setLanguage} />
        </View>

        <Pressable style={styles.row} onPress={() => router.push('/history')}>
          <View style={styles.iconBox}>
            <Feather name="clock" size={18} color={colors.primary} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{t.settings.recordsTitle}</Text>
            <Text style={styles.rowDesc}>{t.settings.recordsDesc}</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textTertiary} />
        </Pressable>

        <View style={styles.info}>
          <View style={styles.infoItem}>
            <Feather name="hard-drive" size={18} color={colors.textSecondary} />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t.settings.privacyTitle}</Text>
              <Text style={styles.rowDesc}>{t.settings.privacyDesc}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Feather name="info" size={18} color={colors.textSecondary} />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t.settings.noticeTitle}</Text>
              <Text style={styles.rowDesc}>{t.settings.noticeDesc}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  section: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, ...shadow.card },
  sectionHead: { flexDirection: 'row', gap: spacing.md },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionText: { flex: 1, gap: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  sectionDesc: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.lg, ...shadow.card },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  rowDesc: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, lineHeight: 19 },
  info: { backgroundColor: colors.bgElevated, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.lg },
  infoItem: { flexDirection: 'row', gap: spacing.md },
});
