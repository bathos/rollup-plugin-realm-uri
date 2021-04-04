import canonicalizeRealmURI from './uri/canonicalize-realm-uri.mjs';
import isRealmURI from './uri/is-realm-uri.mjs';
import isHelperSpecifier from './helpers/is-helper-specifier.mjs';
import renderHelperModule from './helpers/render-helper-module.mjs';
import renderModule from './modules/render-module.mjs';

export default function rollupPluginRealmURI() {
  return {
    name: 'realm-uri',
    resolveId: specifier =>
      isHelperSpecifier(specifier) ? specifier :
      isRealmURI(specifier) ? canonicalizeRealmURI(specifier) :
      null,
    load: specifier =>
      isHelperSpecifier(specifier) ? renderHelperModule(specifier) :
      isRealmURI(specifier) ? renderModule(specifier) :
      null
  };
}

export function esbuild() {
  let rpru = rollupPluginRealmURI();

  return {
    name: 'realm-uri',

    setup(build) {
      build.onResolve({ filter: /^\0?realm:/i }, args => ({
        namespace: 'realm',
        path: rpru.resolveId(args.path)
      }));

      build.onLoad({ filter: /^/i, namespace: 'realm' }, async args => ({
        contents: await rpru.load(args.path)
      }));
    }
  };
}
