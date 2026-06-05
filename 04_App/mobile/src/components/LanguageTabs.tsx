import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing } from '@/constants/theme';
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/i18n/languages';

export function LanguageTabs({
  value,
  onChange,
  variant = 'grid',
  label = 'Language',
}: {
  value: AppLanguage;
  onChange: (language: AppLanguage) => void;
  variant?: 'grid' | 'dropdown';
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedLanguage = SUPPORTED_LANGUAGES.find((language) => language.code === value) ?? SUPPORTED_LANGUAGES[0];

  const selectLanguage = (language: AppLanguage) => {
    onChange(language);
    setOpen(false);
  };

  if (variant === 'dropdown') {
    return (
      <>
        <Pressable style={styles.dropdownButton} onPress={() => setOpen(true)}>
          <View style={styles.dropdownTextWrap}>
            <Text style={styles.dropdownLabel}>{label}</Text>
            <Text style={styles.dropdownValue}>{selectedLanguage.nativeName}</Text>
          </View>
          <Feather name="chevron-down" size={20} color={colors.textTertiary} />
        </Pressable>

        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.modalRoot}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{label}</Text>
                <Pressable style={styles.closeButton} hitSlop={8} onPress={() => setOpen(false)}>
                  <Feather name="x" size={20} color={colors.text} />
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={styles.modalList} showsVerticalScrollIndicator={false}>
                {SUPPORTED_LANGUAGES.map((language) => (
                  <LanguageOption
                    key={language.code}
                    active={language.code === value}
                    name={language.nativeName}
                    layout="row"
                    onPress={() => selectLanguage(language.code)}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <View style={styles.grid}>
      {SUPPORTED_LANGUAGES.map((language) => {
        const active = language.code === value;
        return (
          <LanguageOption
            key={language.code}
            active={active}
            name={language.nativeName}
            layout="grid"
            onPress={() => selectLanguage(language.code)}
          />
        );
      })}
    </View>
  );
}

function LanguageOption({
  active,
  name,
  layout,
  onPress,
}: {
  active: boolean;
  name: string;
  layout: 'grid' | 'row';
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.option,
        layout === 'grid' ? styles.gridOption : styles.rowOption,
        active && styles.optionActive,
      ]}
      onPress={onPress}>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} style={[styles.optionText, active && styles.optionTextActive]}>
        {name}
      </Text>
      <View style={[styles.checkSlot, active && styles.checkSlotActive]}>
        {active && <Feather name="check" size={13} color={colors.white} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridOption: {
    flexBasis: '47.5%',
    flexGrow: 1,
    minHeight: 54,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  rowOption: {
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  optionActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  optionText: { flex: 1, fontSize: 14, color: colors.textSecondary, fontWeight: '800' },
  optionTextActive: { color: colors.primary },
  checkSlot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  checkSlotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownTextWrap: { flex: 1, gap: 2 },
  dropdownLabel: { fontSize: 11, fontWeight: '800', color: colors.textTertiary },
  dropdownValue: { fontSize: 15, fontWeight: '900', color: colors.text },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  sheet: {
    maxHeight: '74%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    ...shadow.float,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.md },
  sheetTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: colors.text },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  modalList: { gap: spacing.sm },
});
