type LocalizedTextLike = string | Partial<Record<string, string>> | undefined;

type SummaryLike = {
  salary?: LocalizedTextLike;
  contractPeriod?: LocalizedTextLike;
};

type TitleInput = {
  title?: string;
  createdAt?: number;
  summary?: SummaryLike;
  ocrText?: string;
};

const MISSING_VALUES = new Set([
  '기재 없음',
  '<기재 없음>',
  'not written',
  'not specified',
  'not stated',
  'n/a',
  '-',
]);

function compact(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function cleanRecordTitle(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const cleaned = compact(value);
  if (!cleaned) return undefined;
  return cleaned.slice(0, 48);
}

function textValue(value: LocalizedTextLike): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return cleanRecordTitle(value);
  return cleanRecordTitle(value.ko ?? value.en ?? Object.values(value).find((entry) => !!entry));
}

function isUsableTitle(value: string | undefined): value is string {
  if (!value) return false;
  return !MISSING_VALUES.has(value.toLowerCase());
}

function formatDate(ms: number | undefined): string {
  const date = new Date(ms && Number.isFinite(ms) ? ms : Date.now());
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}.${p(date.getMonth() + 1)}.${p(date.getDate())}`;
}

export function deriveRecordTitle(input: TitleInput): string {
  const explicitTitle = cleanRecordTitle(input.title);
  if (isUsableTitle(explicitTitle)) return explicitTitle;

  const ocrTitle = cleanRecordTitle(input.ocrText?.split('\n').find((line) => compact(line).length > 0));
  if (isUsableTitle(ocrTitle)) return ocrTitle;

  const period = textValue(input.summary?.contractPeriod);
  if (isUsableTitle(period)) return `근로계약서 ${period}`;

  const salary = textValue(input.summary?.salary);
  if (isUsableTitle(salary)) return `근로계약서 ${salary}`;

  return `근로계약서 ${formatDate(input.createdAt)}`;
}
