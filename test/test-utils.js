require('jsdom-global/register');

const enzyme = require('enzyme');
const Adapter = require('@wojtekmaj/enzyme-adapter-react-17');

enzyme.configure({ adapter: new Adapter() });

const React = require('react');
const Root = require('./root');

const TestHook = ({ callback }) => {
  callback();
  return null;
};

// A helper to make testing hooks easier.
// It uses the actual application root component, with all its context and providers (redux store).
function testHook (callback) {
  // Wrap the synchronously called callback so we can immediately return the FIRST result.
  // This is only to make tests easier to read and write.
  // If you want to get subsequent callback results,
  // you need to have the callback be a closure that mutates variables in the outer scope.
  let callbackResult;
  function callbackWrapper () {
    callbackResult = callback();
  }

  const wrapperComponent = React.createElement(Root, {},
    React.createElement(TestHook, { callback: callbackWrapper })
  );

  enzyme.mount(wrapperComponent);

  return callbackResult;
}

module.exports = {
  testHook
};
