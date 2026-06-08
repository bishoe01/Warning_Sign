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
  new Function('require', 'module', 'exports', compiled)(require, module, module.exports);
  return module.exports;
}

const { cleanRecordTitle, deriveRecordTitle } = loadTsModule('src/data/historyTitle.ts');

assert.strictEqual(cleanRecordTitle('  6월 공장 계약서  '), '6월 공장 계약서');
assert.strictEqual(cleanRecordTitle(''), undefined);

assert.strictEqual(
  deriveRecordTitle({ title: '  6월 공장 계약서  ', createdAt: Date.UTC(2026, 5, 8) }),
  '6월 공장 계약서',
);

assert.strictEqual(
  deriveRecordTitle({
    title: '<기재 없음>',
    ocrText: '표준근로계약서\n1. 근로계약기간',
    createdAt: Date.UTC(2026, 5, 8),
  }),
  '표준근로계약서',
);

assert.strictEqual(
  deriveRecordTitle({
    summary: { contractPeriod: { ko: '2026.06.01 ~ 2027.05.31' } },
    createdAt: Date.UTC(2026, 5, 8),
  }),
  '근로계약서 2026.06.01 ~ 2027.05.31',
);

assert.strictEqual(
  deriveRecordTitle({
    summary: { contractPeriod: { ko: '기재 없음' }, salary: { ko: '기재 없음' } },
    createdAt: Date.UTC(2026, 5, 8),
  }),
  '근로계약서 2026.06.08',
);

console.log('history title tests passed');
