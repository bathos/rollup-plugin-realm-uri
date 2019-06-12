export default function isRealmURI(specifier) {
  try {
    return new URL(specifier).protocol === 'realm:';
  } catch {
    return false;
  }
}
