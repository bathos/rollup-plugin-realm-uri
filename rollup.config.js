import manifest from './package.json';
import path from 'path';
import { fileURLToPath } from 'url';

const root = fileURLToPath(new URL('./', import.meta.url));

export default {
  input: 'src/index.mjs',
  output: [
    { format: 'cjs', file: manifest.main, interop: false, sourcemap: true },
    { format: 'esm', file: manifest.module, interop: false, sourcemap: true }
  ],
  plugins: [ {
    resolveImportMeta(property, { moduleId }) {
      // Rollup’s default import.meta.url handling is what you’d usually want
      // when bundling for browsers, but for Node, it’s not. We’re outputting a
      // result that works in both the esm target and in the cjs target, which
      // is ugly — there’s probably a cleaner way to do this, I’m not sure.

      if (property === 'url') {
        const relativeURL = path.relative(root, moduleId);

        return (
          `new URL(${ JSON.stringify(relativeURL).replace(/\\\\/g, '/') }, ` +
          `(() => { try { return eval('import.meta.url'); } ` +
          `catch { return require('url').pathToFileURL(__dirname); } })()).href`
        );
      }

      return null;
    }
  } ]
};
