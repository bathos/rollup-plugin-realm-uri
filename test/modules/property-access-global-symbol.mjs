import inspectURL from 'realm:URL.prototype[@@"nodejs.util.inspect.custom"]';

t.equal(inspectURL, URL.prototype[Symbol.for('nodejs.util.inspect.custom')]);
