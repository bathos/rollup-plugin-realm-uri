import arrayOf from 'realm:Array.of?transform=bind';

t.ok(arrayOf.call(RegExp) instanceof Array);
