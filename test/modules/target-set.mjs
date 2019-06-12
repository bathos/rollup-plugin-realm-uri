import setPathname from 'realm:URL.prototype.pathname#set';

const url = new URL('https://poop.com');

setPathname.call(url, '💩');

t.equal(url.pathname, '/%F0%9F%92%A9');
