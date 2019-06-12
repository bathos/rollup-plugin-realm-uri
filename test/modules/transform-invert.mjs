import sort from 'realm:Array.prototype.sort?transform=invert';

t.same(sort([ 'c', 'a', 'b' ]), [ 'a', 'b', 'c' ]);
