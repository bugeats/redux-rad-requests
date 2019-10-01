const React = require('react');
const { Provider } = require('react-redux');

const store = require('./store');

function Root ({
  children
}) {
  return React.createElement(Provider, { store }, children || null);
}

module.exports = Root;
