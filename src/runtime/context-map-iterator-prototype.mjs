import getPrototypeOf from 'realm:Reflect.getPrototypeOf';
import Map from 'realm:Map';

export default getPrototypeOf(new Map().keys());
