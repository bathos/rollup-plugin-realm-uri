import apply from 'realm:Reflect.apply';

export default fn =>
  fn == null ? undefined : (receiver, ...args) => apply(fn, receiver, args);
