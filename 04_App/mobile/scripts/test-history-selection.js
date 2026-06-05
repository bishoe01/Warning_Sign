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

const {
  toggleSelectedId,
  selectAllIds,
  pruneSelectedIds,
  selectionSummary,
} = loadTsModule('src/data/historySelection.ts');

assert.deepStrictEqual(toggleSelectedId(['a'], 'b'), ['a', 'b']);
assert.deepStrictEqual(toggleSelectedId(['a', 'b'], 'a'), ['b']);

assert.deepStrictEqual(selectAllIds([{ id: 'a' }, { id: 'b' }]), ['a', 'b']);
assert.deepStrictEqual(pruneSelectedIds(['a', 'missing'], [{ id: 'a' }, { id: 'b' }]), ['a']);

assert.deepStrictEqual(selectionSummary([], 3), { selectedCount: 0, allSelected: false, hasSelection: false });
assert.deepStrictEqual(selectionSummary(['a'], 3), { selectedCount: 1, allSelected: false, hasSelection: true });
assert.deepStrictEqual(selectionSummary(['a', 'b'], 2), { selectedCount: 2, allSelected: true, hasSelection: true });

console.log('history selection tests passed');
