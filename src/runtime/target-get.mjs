import getOwnPropertyDescriptor from 'realm:Reflect.getOwnPropertyDescriptor';

export default (target, key) => getOwnPropertyDescriptor(target, key).get;
