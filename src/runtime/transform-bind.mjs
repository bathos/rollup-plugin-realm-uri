import bind from 'realm:Function.prototype.bind?t=i';

export default (target, receiver) =>
  target == null ? undefined : bind(target, receiver);
