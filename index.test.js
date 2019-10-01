const test = require('tape');

const reduxRadReqeusts = require('./index');

test('redux-rad-requests API is rad', (assert) => {
  // API functions
  [
    'middleware',
    'reducer',
    'useRequest',
    'useRequestDispatcher',
    'useRequestStatus'
  ].forEach(fnKey => {
    assert.ok(
      reduxRadReqeusts[fnKey] instanceof Function,
      `'${fnKey}' function is available`
    );
  });

  // API constants
  [
    'ACTION',
    'CANCELED',
    'DEFAULT_REQUESTS_REDUCER_KEY',
    'PENDING',
    'REJECTED',
    'RESOLVED'
  ].forEach(fnKey => {
    assert.equal(
      typeof reduxRadReqeusts[fnKey],
      'string',
      `'${fnKey}' constant is available`
    );
  });

  assert.end();
});
