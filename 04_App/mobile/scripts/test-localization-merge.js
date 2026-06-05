const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadTsModule(relativePath) {
  const filePath = path.join(__dirname, '..', relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (request) => {
    if (request.startsWith('@/')) return {};
    return require(request);
  };
  new Function('require', 'module', 'exports', compiled)(localRequire, module, module.exports);
  return module.exports;
}

const {
  analysisHasLanguage,
  mergeLocalizedAnalysisPatch,
} = loadTsModule('src/data/localizationMerge.ts');

const base = {
  ocrText: '월 통상임금(100)원',
  summary: {
    salary: { ko: '월 통상임금 100원', en: 'Monthly ordinary wage: 100 KRW' },
    workHours: { ko: '기재 없음', en: 'Not written' },
    holiday: { ko: '기재 없음', en: 'Not written' },
    contractPeriod: { ko: '기재 없음', en: 'Not written' },
    deduction: { ko: '기재 없음', en: 'Not written' },
  },
  cautionItems: [
    {
      level: 'check',
      title: { ko: '임금 비정상 기재', en: 'Unusual wage entry' },
      originalText: '월 통상임금(100)원',
      explanation: {
        ko: '임금이 매우 낮아 보이므로 확인해 보세요.',
        en: 'The wage looks very low, so check it.',
      },
    },
  ],
  notice: { ko: '참고용 안내입니다.', en: 'This is guidance.' },
};

assert.strictEqual(analysisHasLanguage(base, 'en'), true);
assert.strictEqual(analysisHasLanguage(base, 'th'), false);

const patch = {
  targetLanguage: 'th',
  summary: {
    salary: { th: 'ค่าจ้างปกติรายเดือน 100 วอน' },
    workHours: { th: 'ไม่ได้ระบุ' },
    holiday: { th: 'ไม่ได้ระบุ' },
    contractPeriod: { th: 'ไม่ได้ระบุ' },
    deduction: { th: 'ไม่ได้ระบุ' },
  },
  cautionItems: [
    {
      title: { th: 'ค่าจ้างผิดปกติ' },
      explanation: { th: 'ค่าจ้างดูต่ำมาก โปรดตรวจสอบก่อนลงนาม' },
    },
  ],
  notice: { th: 'เป็นคำแนะนำอ้างอิง ไม่ใช่คำปรึกษาทางกฎหมาย' },
};

const merged = mergeLocalizedAnalysisPatch(base, patch);

assert.strictEqual(base.summary.salary.th, undefined);
assert.strictEqual(merged.summary.salary.th, 'ค่าจ้างปกติรายเดือน 100 วอน');
assert.strictEqual(merged.cautionItems[0].title.th, 'ค่าจ้างผิดปกติ');
assert.strictEqual(merged.cautionItems[0].originalText, '월 통상임금(100)원');
assert.strictEqual(analysisHasLanguage(merged, 'th'), true);

console.log('localization merge tests passed');
