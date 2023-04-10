module.exports = function (config) {
  config.set({
    plugins: ['karma-jasmine', 'karma-chrome-launcher', 'karma-typescript'],

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'karma-typescript'],

    // list of files / patterns to load in the browser
    // Here I'm including all of the the Jest tests which are all under the __tests__ directory.
    // You may need to tweak this patter to find your test files/
    files: ['./karma-setup.js', 'packages/**/*.test.ts'],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      // Use webpack to bundle our tests files
      'packages/**.ts': ['karma-typescript'],
    },
    browsers: ['ChromeHeadless'],
    karmaTypescriptConfig: {
      // bundlerOptions: {
      //   // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
      //   transforms: [require('karma-typescript-es6-transform')()],
      // },
      tsconfig: './karma-tsconfig.json',
    },
    logLevel: config.LOG_DEBUG,
  });
};
