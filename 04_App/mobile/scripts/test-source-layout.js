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

const { containRect, sourceBoxToRect } = loadTsModule('src/data/sourceLayout.ts');

assert.deepStrictEqual(containRect({ width: 300, height: 300 }, { width: 100, height: 200 }), {
  left: 75,
  top: 0,
  width: 150,
  height: 300,
});

assert.deepStrictEqual(sourceBoxToRect(
  { pageIndex: 0, x: 0.1, y: 0.2, width: 0.5, height: 0.1 },
  { left: 75, top: 0, width: 150, height: 300 },
), {
  left: 90,
  top: 60,
  width: 75,
  height: 30,
});

assert.deepStrictEqual(containRect({ width: 0, height: 300 }, { width: 100, height: 200 }), {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
});

console.log('source layout tests passed');
