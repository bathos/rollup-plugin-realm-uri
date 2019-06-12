export default new Map([
  'target-descriptor',
  'target-get',
  'target-set',
  'transform-bind',
  'transform-invert'
].map(name => [ `\0realm:${ name }`, toHelperFileURL(name) ]));

function toHelperFileURL(name) {
  return new URL(`../runtime/${ name }.mjs`, import.meta.url);
}
