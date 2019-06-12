/////////////////////// U N U S E D  -  D E M O  O N L Y ///////////////////////
//
// The %AsyncFromSyncIteratorPrototype% is a reachable, reified object according
// to the ES spec. Accessing is considerably more complex than accessing any
// other intrinsic. It requires monkey patching the @@asyncIterator method of
// the %AsyncIteratorPrototype% to capture a reference to the [[Prototype]] of
// its receiver during initial evaluation of a for head that uses `async`. The
// reason this works is that %AsyncFromSyncIteratorPrototype% inherits this
// method from %AsyncIteratorPrototype%, and this forgeable method should be
// invoked from an instance inheriting from %AsyncFromSyncIteratorPrototype%.
// See GetIterator 7.4.1 step 3.a.i, as entered via CreateAsyncFromSyncIterator,
// 25.1.4.1 step 3.
//
// The above describes what should occur in ES as presently defined. However no
// vendors have implemented the CreateAsyncFromSyncIterator as specified. They
// do something similar, but it’s not the same algorithm — in the web reality
// version, @@asyncIterator is never accessed or invoked.
//
// This module is present only for demonstration and is not really part of the
// runtime — if the AsyncFromSyncIteratorPrototype context is used in a realm
// URI, an error is thrown at compilation time.
//
// It is unlikely for the vendor behavior to change. The deparature was likely
// intentional rather than a mistake. CreateAsyncFromSyncIterator will more
// likely be updated to reflect web reality, which is that %AFSIP% is not a real
// well-known intrinsic object and cannot be reached from ES code, instead.

import AsyncIteratorPrototype from 'realm:AsyncIteratorPrototype/';
import asyncIterator from 'realm:AsyncIteratorPrototype/[@@asyncIterator]';
import getPrototypeOf from 'realm:Reflect.getPrototypeOf';
import kAsyncIterator from 'realm:Symbol.asyncIterator';

let AsyncFromSyncIteratorPrototype;

try {
  AsyncIteratorPrototype[kAsyncIterator] = function() {
    AsyncFromSyncIteratorPrototype = getPrototypeOf(this);
    return this;
  };

  // Since it’s not particularly obvious: The for-head rhs is indeed evaluated
  // synchronously to create the async iterator here, so if
  // CreateAsyncFromSyncIterator were implemented as defined,
  // AsyncFromSyncIteratorPrototype would be set before the finally block.

  (async () => { for await (let _ of []); })();
} finally {
  AsyncIteratorPrototype[kAsyncIterator] = asyncIterator;
}

export default AsyncFromSyncIteratorPrototype;
