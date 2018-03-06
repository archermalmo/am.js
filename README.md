<p align="center">
	<img alt="npm version" src="https://img.shields.io/npm/v/@archermalmo/am.js.svg?style=flat">
	<img alt="npm downloads" src="https://img.shields.io/npm/dt/@archermalmo/am.js.svg?style=flat">
	<img alt="license" src="https://img.shields.io/npm/l/@archermalmo/am.js.svg?style=flat">
	<a href="https://travis-ci.org/archermalmo/am.js" target="_blank" rel="noopener noreferrer">
	  <img alt="travis-ci status" src="https://img.shields.io/travis/archermalmo/am.js.svg?style=flat">
	</a>
	<a href="https://codecov.io/gh/archermalmo/am.js" target="_blank" rel="noopener noreferrer">
	  <img src="https://img.shields.io/codecov/c/github/archermalmo/am.js/master.svg?style=flat" />
	</a>
	<img alt="docs site status" src="https://img.shields.io/website-up-down-green-red/http/archermalmo.github.io/am.js.svg?style=flat&label=Docs%20Site">
	<img alt="release date" src="https://img.shields.io/github/release-date/archermalmo/am.js.svg?style=flat">
</p>

# am.js

This project is an internal Javascript library of useful utility classes and functions that can be shared and maintained across Archer Malmo's Digital department.

## Installation

You can install using `yarn`:

```terminal 
$ yarn add -D @archermalmo/am.js
```

or `npm`:

```terminal
$ npm i --save-dev @archermalmo/am.js
```

You can use `am.js` without installing via npm/yarn as well; include a script tag in the `head` of your document that points to the [Unpkg](https://unpkg.com/) distribution:

```html
<script src="https://unpkg.com/@archermalmo/am.js"></script>
```

This will pull in the production version of the [IIFE build](#iife).

## Usage

Many utilities in am.js are able to be used cross-environment. To support browsers, module systems, and node.js, this library is built into three different distributions: 

* [IIFE](#iife)
* [CommonJS module](#commonjs-modules)
* [ES2015 module](#es2015-modules)

All build targets also have [development builds](#environment-specific-builds) for ease-of-use during initial development.

### IIFE

Add the following `script` tag to your HTML:

```html
<script src="/path/to/am.js"></script>
```

Now, am.js utilities are available to be used under the global object `AM`.

```javascript
const siteNavElement = AM.select("nav#site");
// -> <nav id="site">…</nav>

const titleCaseMessage = AM.capitalize("hello world");
// -> 'Hello World'

const dataRequest = new AM.Request({ endpoint: "https://example.com/" });
dataRequest.send().then(res => res.json()).then(console.log);
// -> { some: 'data' }
```

### CommonJS Modules

Use the `require()` function to target the CommonJS build in a file intended to be used in a node.js program or CommonJS module system.

```javascript
const { trim, capitalize } = require("am.cjs");

capitalize(trim("  hello world     "));
// -> "Hello World"
```

### ES2015 Modules

Use the `import ... from "..."` syntax to target the ECMAScript Module build in a file intended to be used in an ES6+ environment or module system (e.g. a Webpack bundle).

```javascript
import { selectById, slugify, Request } from "am.esm"

const titleText = selectById("title").innerText;
// -> "Hello World"

const sluggedTitle = slugify(titleText);
// -> "hello-world"

const postTitle = new Request({ endpoint: "https://api.example.com/", options: { method: "POST" }, body: JSON.stringify(sluggedTitle) });

const postResponse = postTitle.send();

postResponse.then(console.log);
// -> { status: 200, ok: true, …}
```

### Environment-Specific Builds

All environment targets have development builds, denoted by a `.dev` before the Javascript file extension:

* IIFE: `am.dev.js`
* CommonJS: `am.cjs.dev.js`
* ES2015: `am.esm.dev.js`

These builds are non-uglified, with sourcemaps and documenting comments in place; they should only be used in development environments/stages, and switched to non-development builds before deploying to production.

Non-development builds are uglified and minified to provide the most performant bundle possible. 

In order to get the most out of the library and include the least amount of code, it is recommended to use a build tool such as Webpack alongside the `.esm` or `.cjs` module distributions.

## Contributing

### Adding functions or classes by PR

If you have a class or function that you think should be added, complete the following steps:

1. Fork this repository.
2. Create a [feature branch](https://www.google.com/search?q=What+is+a+feature+branch+in+git) in git using a name that describes the feature/bug/addition you are updating/fixing/adding.
3. Add your class or function to the related module under the respective directory in `src`; for example, a function that logs the how much of a page has been scrolled would go under `src/functions/scroll.ts`.
4. If possible, please add some light documentation of the class/function's parameters and variable types using the [JSDoc](http://usejsdoc.org/) specification. (see an [example here](https://github.com/archermalmo/am.js/blob/ffe72906a865fc71651258619ca9ce2557aff98e/src/functions/parse.ts#L1-L7))
5. Open a pull request on this package to your feature branch.

### Running the project

To get started developing this library, follow these steps to get started:

1. Run `npm i` or `yarn` to install dependencies
2. Run `[npm|yarn] start` to start the Rollup (JS bundler) in development mode; note, it is recommended to also run the `test:watch` script alongside the development process, to catch preliminary bugs in the test suite(s) (see #5).
3. All modules are written in [Typescript](https://www.typescriptlang.org/), and are located in `src`; functions are included in modules by category, and classes are their own modules
4. Tests should be written against each added function/class; all tests are located in the `__tests__` directory.
5. Run `[npm|yarn] test` to run a one-off test run; running `[npm|yarn] run test:watch` will start a watch process for tests
6. Once additions have been properly tested, run `[npm|yarn] run build` to build the module bundles into `dist`

### Notes

Below is a list of repo-related notes/gotchas that are useful to know when working on this project or interacting with this repo:

- TravisCI build is disabled for the `docs` branch; no library changes should be made on this branch. Still, adding `[skip ci]` at the beginning of the commit message is useful for preventing these commits from triggering a build when merged into `master` branch.
