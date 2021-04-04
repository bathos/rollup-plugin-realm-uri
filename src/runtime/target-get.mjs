import lookupGetter from 'realm:Object.prototype.__lookupGetter__?t=i';

export default (target, key) =>
  target == null ? undefined : lookupGetter(target, key);
