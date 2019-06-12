import isIdentifier from '../util/is-identifier.mjs';
import { KEY_TYPE_STRING, KEY_TYPE_WELL_KNOWN_SYMBOL } from './key-types.mjs';
import { TARGET_DESCRIPTOR, TARGET_GET, TARGET_SET } from './targets.mjs';
import { TRANSFORM_BIND, TRANSFORM_INVERT } from './transforms.mjs';

export default function renderRealmURI({ context, path, target, transform }) {
  return new URL([
    'realm:',
    ...renderContext(context),
    ...renderPath(path),
    ...renderQuery(transform),
    ...renderFragment(target)
  ].join('')).href;
}

function * renderContext(context) {
  if (context !== 'globalThis') {
    yield context;
    yield '/';
  }
}

function * renderFragment(target) {
  switch (target) {
    case TARGET_DESCRIPTOR:
      yield '#d';
      break;
    case TARGET_GET:
      yield '#g';
      break;
    case TARGET_SET:
      yield '#s';
      break;
  }
}

function * renderQuery(transform) {
  switch (transform) {
    case TRANSFORM_BIND:
      yield '?t=b';
      break;
    case TRANSFORM_INVERT:
      yield '?t=i';
      break;
  }
}

function * renderPath(path) {
  for (const [ index, segment ] of path.entries()) {
    yield * renderPathSegment(segment, index);
  }
}

function * renderPathSegment({ type, value }, index) {
  if (type === KEY_TYPE_STRING && isIdentifier(value)) {
    if (index !== 0) {
      yield '.';
    }

    yield value;
  } else {
    yield '[';

    if (type !== KEY_TYPE_STRING) {
      yield '@@';
    }

    if (type === KEY_TYPE_WELL_KNOWN_SYMBOL) {
      yield value;
    } else {
      yield `"${ value.replace(/[#"]/g, encodeURIComponent) }"`;
    }

    yield ']';
  }
}
