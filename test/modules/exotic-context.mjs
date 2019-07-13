import Generator from 'realm:Generator/';
import resipTag from 'realm:RegExpStringIteratorPrototype/[@@toStringTag]';

t.equal(Generator[Symbol.toStringTag], 'GeneratorFunction');
t.equal(resipTag, 'RegExp String Iterator');
