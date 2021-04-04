export default new Map([
  'target-descriptor',
  'target-get',
  'target-set',
  'transform-bind',
  'transform-invert'
].map(name => [
  `\0realm:${ name }`,
  new URL(`../src/runtime/${ name }.mjs`, import.meta.url)
]));
