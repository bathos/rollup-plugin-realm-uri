import plop from 'realm:Array.prototype.pop?t=i';
import poop from 'realm:["Array"].prototype.pop?TRANSFORM=INVERT';
import posh from 'realm:Array.prototype.push?t=i';

t.equal(plop, poop);
t.notEqual(poop, posh);
t.equal([ ...code.matchAll(/\x41rray/g) ].length, 1);
t.equal([ ...code.matchAll(/\x70rototype/g) ].length, 1);
t.equal([ ...code.matchAll(/\x70op/g) ].length, 1);
t.equal([ ...code.matchAll(/\x70ush/g) ].length, 1);
