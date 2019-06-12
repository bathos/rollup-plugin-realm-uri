// Although `export default globalThis` would be sufficient in real ES modules,
// the explicit (second) property access is necessary because Rollup attempts
// inlining the default expression at points of use if it’s a single identifier.
// It’s possible that this was done on purpose — a little early minification? —
// but it surprised me. It’s a significant semantic difference and is neither
// ESM nor CJS compatible behavior.

export default globalThis.globalThis;
