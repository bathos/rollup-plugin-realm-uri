import CONTEXTS from '../modules/contexts.mjs';
import WELL_KNOWN_SYMBOLS from './well-known-symbols.mjs';
import isIdentifier from '../util/is-identifier.mjs';

import { KEY_TYPE_GLOBAL_SYMBOL, KEY_TYPE_STRING, KEY_TYPE_WELL_KNOWN_SYMBOL }
  from './key-types.mjs';
import { TARGET_DESCRIPTOR, TARGET_GET, TARGET_SET, TARGET_VALUE }
  from './targets.mjs';
import { TRANSFORM_BIND, TRANSFORM_INVERT, TRANSFORM_NONE }
  from './transforms.mjs';

export default function parseRealmURI(source) {
  try {
    const url = new URL(source);
    const { contextSource, pathSource } = splitPathSource(url.pathname);
    const context = parseContext(contextSource);
    const path = [ ...parsePath(pathSource) ];
    const target = getTarget(url.hash);
    const transform = getTransform(url.searchParams);

    if (target !== TARGET_VALUE && path.length === 0) {
      throw new URIError(`Only #value target is valid with empty path`);
    }

    if (transform === TRANSFORM_BIND && path.length === 0) {
      throw new URIError(`Bind transform cannot be used with an empty path`);
    }

    if (target === TARGET_DESCRIPTOR && transform !== TRANSFORM_NONE) {
      throw new URIError(`Only transform=none is valid with #descriptor`);
    }

    return { context, path, target, transform };
  } catch (err) {
    err.message += ` (specifier ${ source })`;
    throw err;
  }
}

////////////////////////////////////////////////////////////////////////////////

const PATH_SEGMENT_COVER_GRAMMAR =
  /(?:(?:^|\.)(?<ident>[^[.]+))|\[(?<special>.+)\]|(?<invalid>.+)/gusy;

const PATH_SEGMENT_SPECIAL_COVER_GRAMMAR =
  /^(?<symbol>@@)?(?:(?:"(?<string>[^"]*)")|(?<badstring>".*)|(?<ident>.+))$/s;

const PATHNAME_COVER_GRAMMAR =
  /^(?:(?<contextSource>[^/[]*)\/)?(?<pathSource>.*)$/s;

////////////////////////////////////////////////////////////////////////////////

function assertIsIdentifier(value) {
  if (!isIdentifier(value)) {
    throw new URIError(quoted`${ value } is not an identifier`);
  }
}

function assertIsKnownContext(value) {
  if (!CONTEXTS.has(value)) {
    throw new URIError(quoted`${ value } is not a recognized context name`);
  }
}

function assertIsKnownSymbol(value) {
  if (!WELL_KNOWN_SYMBOLS.has(value)) {
    throw new URIError(quoted`${ value } is not a recognized symbol name`);
  }
}

function assertIsNotAFSIP(value) {
  if (value === 'AsyncFromSyncIteratorPrototype') {
    throw new URIError(
      `%AsyncFromSyncIteratorPrototype% is not implemented as a reachable, ` +
      `reified ES value in any engine presently. The spec will likely be ` +
      `amended to reflect web reality, in which case it should no longer be ` +
      `listed as a well-known intrinsic object.`
    );
  }
}

function getTarget(fragment) {
  switch (decodeURIComponent(fragment).toLowerCase()) {
    case '#d': case '#descriptor':
      return TARGET_DESCRIPTOR;
    case '#g': case '#get':
      return TARGET_GET;
    case '#s': case '#set':
      return TARGET_SET;
    case '#v': case '#value': case '':
      return TARGET_VALUE;
    default:
      throw new URIError(quoted`${ fragment } fragment is not valid`);
  }
}

function getTransform(usp) {
  let seen = false;
  let transform = TRANSFORM_NONE;

  for (const entry of usp) {
    const [ key, value ] = entry.map(str => str.toLowerCase());

    if (key !== 't' && key !== 'transform') {
      throw new URIError(quoted`${ key } query parameter key is not valid`);
    }

    if (seen) {
      throw new URIError('transform query parameter may appear only once');
    }

    seen = true;

    switch (value) {
      case 'b': case 'bind':
        transform = TRANSFORM_BIND;
        break;
      case 'i': case 'invert':
        transform = TRANSFORM_INVERT;
        break;
      case 'n': case 'none':
        transform = TRANSFORM_NONE;
        break;
      default:
        throw new URIError(quoted`${ value } transform is not valid`);
    }
  }

  return transform;
}

function parseContext(source='') {
  const context = decodeURIComponent(source) || 'globalThis';

  assertIsIdentifier(context);
  assertIsKnownContext(context);
  assertIsNotAFSIP(context);

  return context;
}

function * parsePath(source) {
  for (const { groups } of source.matchAll(PATH_SEGMENT_COVER_GRAMMAR)) {
    if (groups.ident) {
      yield parsePathSegmentIdent(groups.ident);
    } else if (groups.special) {
      yield parsePathSegmentSpecial(groups.special);
    } else {
      throw new URIError(quoted`Realm URI malformed at ${ groups.invalid }`);
    }
  }
}

function parsePathSegmentIdent(source) {
  const ident = decodeURIComponent(source);

  assertIsIdentifier(ident);

  return { type: KEY_TYPE_STRING, value: ident };
}

function parsePathSegmentSpecial(source) {
  const { groups } = source.match(PATH_SEGMENT_SPECIAL_COVER_GRAMMAR);

  if (groups.badstring) {
    throw new URIError(quoted`Unterminated string in property ${ source }`);
  }

  if (groups.ident) {
    if (!groups.symbol) {
      throw new URIError(quoted`${ source } is not a valid bracketed property`);
    }

    const ident = decodeURIComponent(groups.ident);

    assertIsIdentifier(ident);
    assertIsKnownSymbol(ident);

    return { type: KEY_TYPE_WELL_KNOWN_SYMBOL, value: ident };
  }

  return {
    type: groups.symbol ? KEY_TYPE_GLOBAL_SYMBOL : KEY_TYPE_STRING,
    value: decodeURIComponent(groups.string)
  };
}

function quoted(template, ...substitutions) {
  return String.raw(
    { raw: template },
    ...substitutions.map(value => JSON.stringify(value))
  );
}

function splitPathSource(pathname) {
  return pathname.match(PATHNAME_COVER_GRAMMAR).groups;
}
