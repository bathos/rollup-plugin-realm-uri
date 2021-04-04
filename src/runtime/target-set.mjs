import lookupSetter from 'realm:Object.prototype.__lookupSetter__?t=i';

export default (target, key) =>
  target == null ? undefined : lookupSetter(target, key);
