import getPrototypeOf from 'realm:Reflect.getPrototypeOf';
import Set from 'realm:Set';

export default getPrototypeOf(new Set().keys());
