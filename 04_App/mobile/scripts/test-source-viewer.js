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

const { collectPageSourceItems, collectSourceItems, findDefaultSourceItem } = loadTsModule('src/data/sourceViewer.ts');

const items = [
  {
    level: 'check',
    title: { ko: 'Penalty' },
    originalText: 'A',
    explanation: { ko: 'A explanation' },
    source: {
      pageIndex: 0,
      quote: 'A',
      confidence: 'high',
      matchType: 'regionId',
      boxes: [
        { pageIndex: 0, x: 0.1, y: 0.2, width: 0.2, height: 0.05 },
        { pageIndex: 1, x: 0.1, y: 0.4, width: 0.2, height: 0.05 },
      ],
    },
  },
  {
    level: 'review',
    title: { ko: 'Deduction' },
    originalText: 'B',
    explanation: { ko: 'B explanation' },
    source: {
      pageIndex: 0,
      quote: 'B',
      confidence: 'medium',
      matchType: 'exact',
      boxes: [
        { pageIndex: 0, x: 0.3, y: 0.5, width: 0.3, height: 0.05 },
      ],
    },
  },
  {
    level: 'info',
    title: { ko: 'Low confidence' },
    originalText: 'C',
    explanation: { ko: 'C explanation' },
    source: {
      pageIndex: 0,
      quote: 'C',
      confidence: 'low',
      matchType: 'fuzzy',
      boxes: [
        { pageIndex: 0, x: 0.5, y: 0.5, width: 0.2, height: 0.05 },
      ],
    },
  },
  {
    level: 'review',
    title: { ko: 'Overtime' },
    originalText: 'D',
    explanation: { ko: 'D explanation' },
    source: {
      pageIndex: 1,
      quote: 'D',
      confidence: 'high',
      matchType: 'regionId',
      boxes: [
        { pageIndex: 1, x: 0.3, y: 0.6, width: 0.2, height: 0.05 },
      ],
    },
  },
];

const page0Items = collectPageSourceItems(items, 0);
assert.strictEqual(page0Items.length, 2);
assert.deepStrictEqual(page0Items.map((entry) => entry.item.originalText), ['A', 'B']);
assert.deepStrictEqual(page0Items.map((entry) => entry.number), [1, 2]);
assert.deepStrictEqual(page0Items.map((entry) => entry.boxes.length), [1, 1]);

const page1Items = collectPageSourceItems(items, 1);
assert.strictEqual(page1Items.length, 1);
assert.strictEqual(page1Items[0].item.originalText, 'D');
assert.strictEqual(page1Items[0].number, 3);
assert.strictEqual(page1Items[0].boxes[0].pageIndex, 1);

const sourceItems = collectSourceItems(items);
assert.deepStrictEqual(sourceItems.map((entry) => entry.item.originalText), ['A', 'B', 'D']);
assert.deepStrictEqual(sourceItems.map((entry) => entry.number), [1, 2, 3]);
assert.deepStrictEqual(sourceItems.map((entry) => entry.pageIndex), [0, 0, 1]);

assert.strictEqual(findDefaultSourceItem(items, 0)?.originalText, 'A');
assert.strictEqual(findDefaultSourceItem(items, 1)?.originalText, 'D');
assert.strictEqual(findDefaultSourceItem(items, 2), null);

console.log('source viewer tests passed');
