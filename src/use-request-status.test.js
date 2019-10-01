const test = require('tape');

const useRequest = require('./use-request');
const useRequestStatus = require('./use-request-status');
const { testHook } = require('../test/test-utils');

function actionBeta () {
  return {
    type: 'BETA',
    meta: { requestId: 'BETA' },
    async payload () {
      await new Promise(resolve => setTimeout(resolve, 250));
      return 'beta';
    }
  };
}

// -----------------------------------------------------------------------------

test('useRequestStatus', (t) => {
  t.test('should return expected properties', (assert) => {
    const result = testHook(() => useRequestStatus('REQ1'));

    assert.equal(result.status, undefined);
    assert.equal(result.isPending, false);
    assert.equal(result.isResolved, false);
    assert.equal(result.isRejected, false);
    assert.equal(result.isCanceled, false);

    assert.end();
  });

  t.test('should update on resolved', (assert) => {
    let methods;
    let result;
    testHook(() => {
      methods = useRequest(actionBeta);
      result = useRequestStatus('BETA');
    });

    assert.equal(result.status, undefined);
    assert.equal(result.isPending, false);
    methods.start();
    assert.equal(result.isPending, true);
    assert.equal(result.isResolved, false);

    assert.end();
  });
});
