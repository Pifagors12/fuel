// the jest.fn() API
import expect from 'expect';
import jest from 'jest-mock';
// The matchers API

// Add missing Jest functions
window.test = window.it;
window.test.each = (inputs) => (testName, test) =>
  inputs.forEach((args) => window.it(testName, () => test(...args)));
window.test.todo = function () {
  return undefined;
};
window.jest = jest;
window.expect = expect;
