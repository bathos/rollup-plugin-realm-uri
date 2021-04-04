import CONTEXTS from './contexts.mjs';
import parseRealmURI from '../uri/parse-realm-uri.mjs';
import renderRealmURI from '../uri/render-realm-uri.mjs';
import isIdentifier from '../util/is-identifier.mjs';
import readFile from '../util/read-file.mjs';

import { KEY_TYPE_GLOBAL_SYMBOL, KEY_TYPE_STRING, KEY_TYPE_WELL_KNOWN_SYMBOL }
  from '../uri/key-types.mjs';
import { TARGET_DESCRIPTOR, TARGET_GET, TARGET_SET, TARGET_VALUE }
  from '../uri/targets.mjs';
import { TRANSFORM_BIND, TRANSFORM_INVERT, TRANSFORM_NONE }
  from '../uri/transforms.mjs';

export default function renderModule(specifier) {
  const { context, path, target, transform } = parseRealmURI(specifier);
  const lines = [];

  if (transform !== TRANSFORM_NONE) {
    lines.push(renderTransformImport(transform));
    lines.push(renderAncestor('fn', context, path, target));

    if (transform === TRANSFORM_INVERT) {
      lines.push(`export default transform(fn);\n`);
    } else {
      lines.push(renderAncestor('lhs', context, path.slice(0, -1)));
      lines.push(`export default transform(fn, lhs);\n`)
    }
  } else if (path.length === 0) {
    return readFile(CONTEXTS.get(context), 'utf8');
  } else {
    const keyDescriptor = path.pop();

    let keyExpression;
    let propertyAccess;

    lines.push(renderAncestor('lhs', context, path));

    switch (keyDescriptor.type) {
      case KEY_TYPE_GLOBAL_SYMBOL:
        lines.push(`import symbolFor from 'realm:Symbol.for';`);
        keyExpression = `symbolFor(${ JSON.stringify(keyDescriptor.value) })`;
        propertyAccess = `?.[${ keyExpression }]`;
        break;
      case KEY_TYPE_STRING:
        keyExpression = JSON.stringify(keyDescriptor.value);
        propertyAccess = isIdentifier(keyDescriptor.value)
          ? `?.${ keyDescriptor.value }`
          : `?.[${ keyExpression }]`;
        break;
      case KEY_TYPE_WELL_KNOWN_SYMBOL:
        lines.push(`import key from 'realm:Symbol.${ keyDescriptor.value }'`);
        keyExpression = 'key';
        propertyAccess = '?.[key]';
        break;
    }

    if (target === TARGET_VALUE) {
      lines.push(`export default lhs${ propertyAccess };\n`);
    } else {
      lines.push(renderGetTargetImport(target));
      lines.push(`export default get(lhs, ${ keyExpression });\n`);
    }
  }

  return lines.join('\n');
}

function renderAncestor(id, context, path, target=TARGET_VALUE) {
  return `import ${ id } from ${ JSON.stringify(renderRealmURI({
    context, path, target,
    transform: TRANSFORM_NONE
  })) };`
}

function renderGetTargetImport(target) {
  switch (target) {
    case TARGET_DESCRIPTOR:
      return `import get from '\0realm:target-descriptor';`
    case TARGET_GET:
      return `import get from '\0realm:target-get';`
    case TARGET_SET:
      return `import get from '\0realm:target-set';`
  }
}

function renderTransformImport(transform) {
  switch (transform) {
    case TRANSFORM_BIND:
      return `import transform from '\0realm:transform-bind';`
    case TRANSFORM_INVERT:
      return `import transform from '\0realm:transform-invert';`
  }
}
