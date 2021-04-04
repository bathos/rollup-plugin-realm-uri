import manifest from './package.json';

export default {
  input: 'src/index.mjs',
  output: {
    format: 'esm',
    file: manifest.main,
    interop: false,
    sourcemap: true
  }
};
