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
  LOADING_STEP_MS,
  COMPLETION_HOLD_MS,
  completedStepIndex,
  timedStepIndex,
  activeSegmentCount,
} = loadTsModule('src/data/loadingProgress.ts');

assert.strictEqual(LOADING_STEP_MS >= 1200, true);
assert.strictEqual(COMPLETION_HOLD_MS >= 400, true);

assert.strictEqual(timedStepIndex(0, 4), 0);
assert.strictEqual(timedStepIndex(LOADING_STEP_MS, 4), 1);
assert.strictEqual(timedStepIndex(LOADING_STEP_MS * 2, 4), 2);
assert.strictEqual(timedStepIndex(LOADING_STEP_MS * 10, 4), 2);

assert.strictEqual(activeSegmentCount(0, 4, false), 1);
assert.strictEqual(activeSegmentCount(2, 4, false), 3);
assert.strictEqual(activeSegmentCount(3, 4, false), 3);
assert.strictEqual(activeSegmentCount(3, 4, true), 4);
assert.strictEqual(completedStepIndex(4), 3);

console.log('loading progress tests passed');
