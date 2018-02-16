# am.js

This project is an internal Javascript library of useful utility classes and functions that can be shared and maintained across Archer Malmo's Digital department.

## Installation

*Coming soon*

## Contributing

### Adding functions or classes by PR

If you have a class or function that you think should be added, complete the following steps:

1. Fork this repository.
2. Create a [feature branch](https://www.google.com/search?q=What+is+a+feature+branch+in+git) in git using your name.
3. Add your class or function to the related module under the respective directory in `src`; for example, a function that logs the how much of a page has been scrolled would go under `src/functions/scroll.ts`.
4. If possible, please add some light documentation of the class/function's parameters and variable types using the [JSDoc](http://usejsdoc.org/) specification. (see an [example here](https://github.com/archermalmo/am.js/blob/ffe72906a865fc71651258619ca9ce2557aff98e/src/functions/parse.ts#L1-L7))
5. Open a pull request on this package to your feature branch.

### Running the project

To get started developing this library, follow these steps to get started:

1. Run `npm i` or `yarn` to install dependencies
2. Run `[npm|yarn] start` to start the Rollup (JS bundler) in development mode
3. All modules are written in [Typescript](), and are located in `src`; functions are included in modules by category, and classes are their own modules
4. Tests should be written against each added function/class; all tests are located in the `__tests__` directory.
5. Run `[npm|yarn] test` to run a one-off test run; running `[npm|yarn] run test:watch` will start a watch process for tests
6. Once additions have been properly tested, run `[npm|yarn] run build` to build the module bundles into `dist`