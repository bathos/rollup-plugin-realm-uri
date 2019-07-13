import getPrototypeOf from 'realm:Reflect.getPrototypeOf';
import matchAll from 'realm:RegExp.prototype[@@matchAll]?t=b';

export default getPrototypeOf(matchAll());
