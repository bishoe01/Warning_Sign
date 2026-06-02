export const SUPPORTED_LANGUAGES = [
  { code: 'ko', nativeName: '한국어', englishName: 'Korean' },
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'ne', nativeName: 'नेपाली', englishName: 'Nepali' },
  { code: 'tet', nativeName: 'Tetun', englishName: 'Tetum' },
  { code: 'ru', nativeName: 'Русский', englishName: 'Russian' },
  { code: 'mn', nativeName: 'Монгол', englishName: 'Mongolian' },
  { code: 'my', nativeName: 'မြန်မာ', englishName: 'Burmese' },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali' },
  { code: 'vi', nativeName: 'Tiếng Việt', englishName: 'Vietnamese' },
  { code: 'uz', nativeName: "O'zbek", englishName: 'Uzbek' },
  { code: 'id', nativeName: 'Bahasa Indonesia', englishName: 'Indonesian' },
  { code: 'zh', nativeName: '中文', englishName: 'Chinese' },
  { code: 'km', nativeName: 'ភាសាខ្មែរ', englishName: 'Khmer' },
  { code: 'ky', nativeName: 'Кыргызча', englishName: 'Kyrgyz' },
  { code: 'th', nativeName: 'ไทย', englishName: 'Thai' },
  { code: 'lo', nativeName: 'ລາວ', englishName: 'Lao' },
] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: AppLanguage = 'ko';

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return SUPPORTED_LANGUAGES.some((language) => language.code === value);
}

export function languageName(code: AppLanguage): string {
  return SUPPORTED_LANGUAGES.find((language) => language.code === code)?.nativeName ?? code;
}
