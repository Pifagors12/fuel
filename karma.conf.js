module.exports = function (config) {
  config.set({
    // eslint-disable-next-line global-require
    plugins: [require('karma-webpack'), require('karma-jasmine'), require('karma-chrome-launcher')],
    frameworks: ['jasmine'],
    files: [
      // Add any files you want to include in the test environment here
      '**/*.test.ts',
    ],
    preprocessors: {
      // Specify any preprocessors you want to use for your test files
      '**/*.test.ts': ['webpack'],
    },
    webpack: {
      // Configure webpack to handle TypeScript files
      module: {
        rules: [
          {
            test: /\.ts$/,
            use: 'ts-loader',
            exclude: /node_modules/,
          },
        ],
      },
      resolve: {
        extensions: ['.ts', '.js'],
      },
    },
    webpackMiddleware: {
      stats: 'errors-only',
    },
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    concurrency: Infinity,
  });
};
