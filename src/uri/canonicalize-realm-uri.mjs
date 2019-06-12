import isIdentifier from '../util/is-identifier.mjs';
import parseRealmURI from './parse-realm-uri.mjs';
import renderRealmURI from './render-realm-uri.mjs';

export default function canonicalizeRealmURI(uri) {
  return renderRealmURI(parseRealmURI(uri));
}
