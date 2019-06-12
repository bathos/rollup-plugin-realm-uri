import HELPERS from './helpers.mjs';
import readFile from '../util/read-file.mjs';

export default function renderRealmURIHelperModule(specifier) {
  return readFile(HELPERS.get(specifier), 'utf8');
}
