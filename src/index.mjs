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
