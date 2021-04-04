export default new Map([
  'ArrayIteratorPrototype',
  'AsyncFromSyncIteratorPrototype',
  'AsyncFunction',
  'AsyncFunctionPrototype',
  'AsyncGenerator',
  'AsyncGeneratorFunction',
  'AsyncGeneratorPrototype',
  'AsyncIteratorPrototype',
  'Generator',
  'GeneratorFunction',
  'GeneratorPrototype',
  'IteratorPrototype',
  'MapIteratorPrototype',
  'RegExpStringIteratorPrototype',
  'SetIteratorPrototype',
  'StringIteratorPrototype',
  'ThrowTypeError',
  'TypedArray',
  'TypedArrayPrototype',
  'globalThis'
].map(name => [ name, toContextFileURL(name) ]));

function toContextFileURL(name) {
  const slug = name.replace(/(?<=[a-z])(?=[A-Z])/g, '-').toLowerCase();
  return new URL(`../src/runtime/context-${ slug }.mjs`, import.meta.url);
}
