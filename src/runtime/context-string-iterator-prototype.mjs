import getPrototypeOf from 'realm:Reflect.getPrototypeOf';
import kIterator from 'realm:Symbol.iterator';

export default getPrototypeOf(''[kIterator]());
