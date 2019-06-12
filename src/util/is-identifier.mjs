const IDENTIFIER = /^[\p{ID_Start}$_][\p{ID_Continue}$\u200C\u200D]*$/u;

export default function isIdentifier(value) {
  return IDENTIFIER.test(value);
}
