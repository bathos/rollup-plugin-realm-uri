import apply from 'realm:Reflect.apply';

export default fn => (receiver, ...args) => apply(fn, receiver, args);
