import getSetSize from 'realm:Set.prototype.size?t=i#g';

t.equal(getSetSize(new Set('abc')), 3);
