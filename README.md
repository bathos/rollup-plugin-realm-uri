# Rollup Plugin ‘Realm URI’

This [Rollup][rollup] plugin adds support for ES import specifiers that use a
`realm:` scheme URI to allow importing deduplicated, fixed references to global
values within the current realm.

<!-- MarkdownTOC autolink=true -->

- [Usage example](#usage-example)
- [When is this useful?](#when-is-this-useful)
- [How do realm URIs help?](#how-do-realm-uris-help)
- [Realm URIs](#realm-uris)
  - [Pathname](#pathname)
    - [Context](#context)
    - [Property path](#property-path)
  - [Query](#query)
    - [Transform: Invert](#transform-invert)
    - [Transform: Bind](#transform-bind)
    - [Other transforms](#other-transforms)
  - [Fragment](#fragment)
  - [Percent-encoding](#percent-encoding)
  - [Valid combinations](#valid-combinations)
- [Additional considerations](#additional-considerations)

<!-- /MarkdownTOC -->

## Usage example

Your module. You want to use `find`, but you do not trust the environment to
leave intrinsics alone. Or perhaps this function wants to accept any array-like,
not limited to arrays:

```js
import find from 'realm:Array.prototype.find?t=invert';

export function getFoo(arr) {
  return find(arr, member => member.id === 'foo');
}
```

Your rollup config:

```js
import rollupPluginRealmURI from 'rollup-plugin-realm-uri';

export default {
  input: 'src/index.mjs',
  output: { format: 'esm', file: 'dist/index.mjs' },
  plugins: [ rollupPluginRealmURI() ]
};
```

## When is this useful?

Realm URIs try to address some of the awkwardness of authoring highly defensive
JavaScript. We should first explore ‘when is it worthwhile to write defensive
JavaScript?’, then look at how realm URIs may help with that. For that matter,
we should probably start by clarifying what’s meant by ‘defensive’ here.

‘Defensive code’ can mean several things. Here, it’s something pretty specific:
code that aims to reduce the ‘assumption surface area’ regarding globally
mutable state. While many dynamic languages have shared global state, this can
be particularly challenging in JS.

Typically, if we want to use `Date`, we just type `Date`. It’s already in scope
— it’s a global. Likewise for `Object.keys` and many others. We also call
inherited built-in methods all the time — `myArray.forEach`, say. Those methods
are global too, just not in all the same senses.

When we do this, we’re making assumptions about global state that is actually
mutable (unless we’ve [frozen the realm][frozen-realms] or are inside certain
kinds of [secure sandboxes][ses]). Usually when we talk about ‘global state,’
we’re only to referring to globally-scoped variables introduced by our
application code. However there’s no essential difference between these and the
intrinsics defined by ECMAScript itself (or HTML, etc).

There are good reasons to pretend there is a difference, though. It’s generally
impractical and counterproductive to worry about the global mutable state of
builtins. We accept the fiction that code relying on global state has defined
behavior (sometimes even labeling it ‘pure’) because giving it defined behavior
takes a lot of extra work, makes the code less approachable, and typically will
not produce significant (or any) benefit. Instead, we have a sanity-preserving
rule for human beings: ‘no one should alter intrinsics except to (accurately)
polyfill’. It’s a caveat emptor, really. If someone writes nonsense like, say,
`Array.prototype.map = console.log`, then opens a GitHub issue on a library
complaining that the library wasn’t robust enough to handle this ... well, it’s
a pretty safe bet that the issue will get closed with `wontfix` and one to four
laughing-face emoji.

Even if we might consider these circumstances suboptimal, it seems to work out
alright almost always. So what conditions might make the caveat emptor
inadequate? The most perfect example is occurs in the context of adblocking
extensions. Adblockers are in an arms race with other code in the same (or
connected) realms to control certain facets of the environment — while remaining
undetected. Every assumption the adblocker makes about global state could become
an opportunity for anti-adblocking code to compromise the adblocker. Instead of
code that wants to work together, here we’re looking at two applications in an
adversarial relationship running in a shared environment. A ‘you just shouldn’t
do that’ golden rule means nothing here.

There are less extreme scenarios where defensiveness about global state may also
be worthwhile. Polyfills, which often aim to be spec compliant implementations
to whatever extent is possible, are another place you’re apt to find it. The
internal operations of native implementations are never affected by the state of
the ES realm, so a high fidelity polyfill would not be, either. Since polyfills
are generally narrow in scope, the extra effort involved in this defensiveness
tends to stay manageable and justifiable.

More generally, libraries which will be used on many uncontrolled websites may
wish to take on some measure of defensiveness. It may be targeted, addressing
only well-known hauntings like MooTools. Effective defensive code may benefit
from entering a mindset where other code is presumed to be adversarial, but this
shouldn’t be mistaken for ascribing real-world malicious intent. Almost all
realm poisoning occuring in nature is well-intentioned or historical and just
happens to break our expectations today. If you’re authoring shared widgets
like, say, the Twitter embed, whose audience will include people with limited
development experience on Wordpress sites that load seven different instances of
jQuery per page, ‘don’t you know you shouldn’t do that?’ is neither realistic
nor fair to your users. There’s some really wild shit out there, but there isn’t
always somebody around who can fix it.

I’ve mentioned or implied a few times that defensive JS has a cost. It’s a
pretty high cost. It influences how code is written in deep ways — you have to
pay attention to things that are normally treated as implementation details. The
code will become less idiomatic, sometimes downright strange. The potential
benefits in a given case must be weighed against the downside of a codebase
which may become harder to understand and which requires some less-common domain
expertise to be maintained.

<details>
  <summary>❔ <em>Why do you, author, care about this?</em></summary>

> &nbsp;
>
> Mainly curiosity, which I think began when I worked at [Wistia][wistia]. The
> Wistia video player is used on a ton of websites. Occasionally, a bug
> investigation would reveal the root cause was one of our innocent looking
> environmental assumptions being invalidated by realm poisoning. Sometimes
> these issues can be totally unique to one website — it’s not always due to old
> toolbelt libs. People are very creative! Those sorts of bugs are hard to trace
> (especially since you’re looking at somebody else’s production site), and I
> wondered whether there were generalizable mitigation strategies that could
> improve the odds of a library trudging right through a JavaScript Bosch
> painting unfazed.
>
> I’m also an insufferable extensible-web nutcase, so anything that helps bring
> ES-authored APIs to parity with native implementations pushes my buttons.
> Ultimately, though, I just think it’s an interesting problem space.

</details>

## How do realm URIs help?

The most common tool for mitigating against global mutation affecting your code
is capturing references to intrinsic values at module or script evaluation time
instead of dynamically accessing them later on.

> It’s impossible to eliminate assumptions about global state while also
> availing ourselves of built-in platform functionality — some of which will be
> the only place that primitive functionality exists. For example, the primitive
> building blocks for weak associations live in WeakSet and WeakMap’s (mutable)
> APIs. Short of reimplementing JS and its garbage collection in the JS layer,
> we cannot make use of weak associations without touching those APIs at least
> once.

Consider the following two similar modules:

```js
export function isSafeInteger(value) {
  return (
    Number.isInteger(value) &&
    value >= Number.MIN_SAFE_INTEGER &&
    value <= Number.MAX_SAFE_INTEGER
  );
}
```

```js
const { isInteger, MIN_SAFE_INTEGER, MAX_SAFE_INTEGER } = Number;

export function isSafeInteger(value) {
  return (
    isInteger(value) &&
    value >= MIN_SAFE_INTEGER &&
    value <= MAX_SAFE_INTEGER
  );
}
```

Both of these modules expect Number to be defined, and both expect it to have
three properties with particular values. The difference is not the assumptions
themselves, but rather their scope. The former module makes these assumptions
again every time the `isSafeInteger` function is invoked, while the latter only
makes the assumptions once, at module evaluation time.

Realm URIs provide a way to import intrinsics like these, deduplicating the
‘capture statements’ that might end up repeated many times otherwise.

```js
import isInteger from 'realm:Number.isInteger';
```

Each module that uses `isInteger` will point at a single module that performs
the property access once during initial evaluation. But this example doesn’t
show us much — to be honest, the import isn’t much of an improvement here. Where
things get interesting is _methods._

Avoiding dynamic property access after initial evaluation is not usually as
simple as in the above example. Methods and accessors introduce the most common
complication:

```js
const { slice } = Array.prototype;

// How to use slice? If we do slice.call(), we’re only moving the problem
// around, since now we’re dynamically accessing Function.prototype.call.
```

To address this, realm URIs may include a query parameter, `transform=invert`,
which requests a new version of the target method which takes the receiver
(`this`) as its first argument. Transform queries have shorthand because they
are needed frequently.

```js
import slice from 'realm:Array.prototype.slice?t=i';

slice([ 1, 2, 3 ], 1); // [ 2, 3 ]
```

<details>
  <summary>❔ <em>How does invert work?</em></summary>

> &nbsp;
>
> Invert uses `Reflect.apply` (captured) to invoke the wrapped function with a
> specific receiver (`this` arg) without using property lookup. Doing this
> directly in your code adds a lot of noisy boilerplate, so the declarative
> wrapping can help a lot.
>
> Both `Reflect.apply` and `Function.prototype.apply` take an argument that
> represents the arguments to invoke the target function with. The astute
> paranoiac may wonder if this is safe — won’t `@@iterator` and `next` be
> called? Fortunately, both of these methods accept an arraylike, not an
> iterable, and array index keyed properties and the length property of an array
> exotic object are reliable in this context.

</details>

JS written without methods may tend to end up looking lispy. Methods that would
typically be chained end up nested instead: `foo.bar().baz().qux()` becomes
`qux(baz(bar(foo)))`. The usual order can still be had if you perform a series
of assignments instead of nesting, but if you happen to be playing around with
the pipeline operator proposal, you might actually consider this an ergonomic
enhancement. Generally, methodless JS plays a little nicer with functional
programming patterns.

> Aside from its inadvertent friendliness towards functional programming,
> another incidental benefit is that it tends to increase opportunities for name
> mangling during minification. Even after compression, name mangling is
> typically the most effective minification technique. In code that makes heavy,
> repeated use of builtin APIs, the difference is sometimes pretty significant.

---

The sum effect of using realm URIs in defensive code is that they help reduce
boilerplate, avoid bloat, and bring a bit of consistency to what may tend to end
up feeling like a pretty messy set of concerns.

Having looked at examples of the core functionality, we can now dig into the
realm URI grammar and what each part of the URI means.

## Realm URIs

Just to be clear: the `realm:` scheme is not a formally registered URI scheme.
It is defined here and implemented only by this library.

Realm scheme URIs conform to the [URL specification][url]. They are
[non-special][special-scheme] and they do not have username, password, hostname,
or port, but they do have pathname, fragment, and query portions.

### Pathname

The pathname consists of two parts: the _context_ and the _path_.

#### Context

The context determines the base (leftmost) value of the virtual member
expression which the URI describes.

The examples we have seen so far omitted an explicit context. The default,
`globalThis`, is usually what you want. However there is some intrinsic global
state which cannot be reached from `globalThis` (or which can only be reached
using Annex B properties) and that’s where explicit contexts come in.

A context is an identifier followed by one slash.

```js
import next from 'realm:ArrayIteratorPrototype/next';
```

There are currently 19 possible context values. Aside from `globalThis`, their
names can be found in the list of [well-known intrinsic objects][wkio]\*.
Specifically, they are the rows in that table where the ‘global name’ cells are
blank. When used in a realm URI, the delimiting percent signs (which would
collide with URI percent encoding) are omitted.

> \* Presently `%RegExpStringIteratorPrototype%` is missing from the list but I
> believe this is accidental.

#### Property path

The rest of the pathname is the (property) path, which resembles a member
expression. Segments may be ES identifiers (bare), prefixed with a period except
in initial position, or they may use a bracket notation for describing both
string and symbol keys (well-known or global).

Multiple representations may exist for a single URI pointing at a single module:

```js
import createA from 'realm:Object.create';
import createB from 'realm:["Object"]["create"]';
import createC from 'realm:Object.creat%65';

assert(createA === createB);
assert(createA === createC);
```

The canonical representation is the shortest representation. If the canonical
path, query, and fragment are the same, they are understood to point at the same
module. Paths describing different properties are distinct, even if they happen
to point at the same value. For example, "realm:Object" and "realm:constructor"
are different modules.

Strings are double-quote delimited. Well-known symbols use `@@identifier`
notation, where `identifier` is the property name by which the well-known symbol
is exposed on `Symbol`. Global symbols use `@@"string"` notation.

```js
import values from 'realm:Array.prototype[@@iterator]';
import inspectURL from 'realm:URL.prototype[@@"nodejs.util.inspect.custom"]';
```

The property path can be empty. In this case, the URI is addressing the context
directly. Since the context part is also optional, the URI `realm:` is valid:
`import globalThis from 'realm:';`.

<details>
  <summary>❔ <em>What is a well-known or global symbol?</em></summary>

> &nbsp;
>
> A well-known symbol is one defined by ES proper, like `Symbol.iterator`. A
> global symbol is one accessed through `Symbol.for(string)`. In both cases,
> these symbols can be generically serialized — the former because the name to
> value mapping is defined by ES and the latter because the string is sufficient
> for obtaining the symbol in any realm. Symbols created with `Symbol()`,
> however, are not generically serializable and can’t be expressed in URIs.

</details>

### Query

The query portion of the URI currently supports a single parameter, `transform`.

| parameter            | short | target      | wat                             |
|----------------------|-------|-------------|---------------------------------|
| `transform=bind`     | `t=b` | method      | bind receiver to LHS            |
| `transform=invert`   | `t=i` | method      | unshift receiver into signature |
| `transform=none`     | `t=n` | any         | value as-is                     |

Whether a given tranformation is applicable depends on the nature of the target
of the URI, which is generally not something known until runtime. The default
is ‘none’. We’ll now look at what each transformation does, starting with the
most useful item, `invert`.

#### Transform: Invert

The ‘invert’ transformation takes a method and returns a non-method function.
The new function accepts the would-be receiver (`this` value) as its first
argument:

```js
import pop from 'realm:Array.prototype.pop?t=invert';

pop([ 3, 4 ]); // 4
```

#### Transform: Bind

The bind transformation is only occasionally useful. It is mainly helpful for
static methods which are receiver-sensitive, like those of `Promise`, or for
instance methods which you may want to associate with an existing singleton
instance. Consider the following module using ‘invert’:

```js
import Promise from 'realm:Promise';
import createElement from 'realm:Document.prototype.createElement?t=i';
import document from 'realm:document';
import resolve from 'realm:Promise.resolve?t=i';

const promise = resolve(Promise, createElement(document, 'marquee'));
```

In practice, it’s very likely that we always want to use `Promise` as the
receiver for `resolve`, and perhaps we know we always want to create elements
using the local document instance. We can simplify this using `bind`, then:

```js
import resolve from 'realm:Promise.resolve?t=bind';
import createElement from 'realm:document.createElement?t=bind';

const promise = resolve(createElement('marquee'));
```

#### Other transforms

I’ve experimented with a third transform, ‘snapshot’, intended for constructors.
The snapshot transform would return a new class with a cloned, flattened
interface, allowing (potentially) safe use of ordinary methods, provided the
snapshot instances are used only internally. This approach is effective for
Array (because of @@species) and RegExp (because of ... everything). But there
are caveats, especially for userland classes. The constraints are complex and
challenging to communicate, so I haven’t felt it is suitable for inclusion yet.

### Fragment

The fragment portion of the URI must be, if present, one of the following:

| fragment      | short | meaning                                              |
|---------------|-------|------------------------------------------------------|
| `#descriptor` | `#d`  | target is the property descriptor                    |
| `#get`        | `#g`  | target is `get` function of the property descriptor  |
| `#set`        | `#s`  | target is `set` function of the property descriptor  |
| `#value`      | `#v`  | target is the property value (retrieved with Get())  |

The default is `#value`. The `#value` fragment works with properties which are
only inherited by the lefthand side object, but the other three fragments
expect an own-property to exist.

Accessor get/set functions are effectively methods, just exposed through a
different API, so they are suitable for use with the `invert` transform.

```js
import getSetSize from 'realm:Set.prototype.size?t=i#get';

getSetSize(new Set('abc')); // 3
```

### Percent-encoding

Percent-encoded bytes describing valid UTF-8 code unit sequences are legal in
Realm URIs, but as in other URIs, only to represent values that aren’t syntactic
constructs in the realm URI grammar. Depending on context, realm URIs consider
periods, brackets, at-signs, and double quotes to be syntactic where an HTTP URL
would not. For example, `realm:%41rray.of` is valid while `realm:Array%2Eof`
isn’t.

The realm URI grammar must be a subset of the URL grammar. This means that a "?"
or "#" terminates the pathname portion of a URI even if it occurs within
brackets or quotes. These characters must be percent-encoded.

### Valid combinations

Certain combinations of transforms, targets, and paths are not valid, but it
will probably be apparent why. For example, you cannot use `invert` with
`descriptor` because we know that a descriptor target will never be a function.
Where it’s possible for us to know that a combination is invalid statically, an
error will be thrown at compilation time.

## Additional considerations

The realm URI scheme aims to make writing defensive JS more comfortable, but
using it does not instantly make code ‘safer’. There are many additional
considerations when avoiding sensitivity to realm mutation which are not
addressed at all here. Ultimately you have to know exactly what a function is
doing to be able to say whether it’s safe. Some intrinsics require special
wrapping or custom reimplementation to patch the holes.

---

[frozen-realms]:
  https://github.com/tc39/proposal-frozen-realms/
  "Frozen Realms EcmaScript proposal"

[rollup]:
  https://rollupjs.org/guide/en/
  "Rollup.js"

[ses]:
  https://github.com/Agoric/SES
  "SES (Secure EcmaScript)"

[special-scheme]:
  https://url.spec.whatwg.org/#special-scheme
  "URL miscellaneous: special scheme"

[url]:
  https://url.spec.whatwg.org/
  "URL Living Standard (WHATWG)"

[wistia]:
  https://wistia.com/support/player
  "Wistia Player"

[wkio]:
  https://tc39.es/ecma262/#sec-well-known-intrinsic-objects
  "ECMA 262: Well-Known Intrinsic Objects"
