import type { AnalysisResult, CautionItem, Language, Summary } from '@/data/sampleAnalysis';
import type { LocalizedText } from '@/i18n/localized';

export type CautionLocalizationPatch = {
  title: LocalizedText;
  explanation: LocalizedText;
};

export type LocalizedAnalysisPatch = {
  targetLanguage: Language;
  summary: Summary;
  cautionItems: CautionLocalizationPatch[];
  notice: LocalizedText;
};

const SUMMARY_KEYS = ['salary', 'workHours', 'holiday', 'contractPeriod', 'deduction'] as const;

function hasLocalizedText(value: LocalizedText | undefined, language: Language): boolean {
  return typeof value?.[language] === 'string' && value[language]!.trim().length > 0;
}

export function analysisHasLanguage(result: AnalysisResult, language: Language): boolean {
  const hasSummary = SUMMARY_KEYS.every((key) => hasLocalizedText(result.summary[key], language));
  const hasNotice = hasLocalizedText(result.notice, language);
  const hasCautionItems = result.cautionItems.every((item) => (
    hasLocalizedText(item.title, language) && hasLocalizedText(item.explanation, language)
  ));
  return hasSummary && hasNotice && hasCautionItems;
}

function mergeText(base: LocalizedText, patch: LocalizedText): LocalizedText {
  return { ...base, ...patch };
}

function mergeSummary(base: Summary, patch: Summary): Summary {
  return {
    salary: mergeText(base.salary, patch.salary),
    workHours: mergeText(base.workHours, patch.workHours),
    holiday: mergeText(base.holiday, patch.holiday),
    contractPeriod: mergeText(base.contractPeriod, patch.contractPeriod),
    deduction: mergeText(base.deduction, patch.deduction),
  };
}

function mergeCautionItem(base: CautionItem, patch: CautionLocalizationPatch): CautionItem {
  return {
    ...base,
    title: mergeText(base.title, patch.title),
    explanation: mergeText(base.explanation, patch.explanation),
  };
}

export function mergeLocalizedAnalysisPatch(
  result: AnalysisResult,
  patch: LocalizedAnalysisPatch,
): AnalysisResult {
  if (result.cautionItems.length !== patch.cautionItems.length) {
    throw new Error(`localized caution item count mismatch: expected ${result.cautionItems.length}, got ${patch.cautionItems.length}`);
  }

  return {
    ...result,
    summary: mergeSummary(result.summary, patch.summary),
    cautionItems: result.cautionItems.map((item, index) => mergeCautionItem(item, patch.cautionItems[index])),
    notice: mergeText(result.notice, patch.notice),
  };
}
