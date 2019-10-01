const test = require('tape');

const useRequest = require('./use-request');
const { testHook } = require('../test/test-utils');


function actionGamma () {
  return {
    type: 'GAMMA',
    meta: { requestId: 'GAMMA' },
    async payload () {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'gamma';
    }
  };
}

test('useRequest', (t) => {
  t.test('basic usage', async (assert) => {
    let result;
    testHook(() => {
      result = useRequest(actionGamma);
    });

    assert.equal(result.isPending, false);
    assert.equal(result.isResolved, false);
    assert.equal(result.isCanceled, false);
    assert.equal(result.isRejected, false);
    assert.equal(result.requestId, undefined);

    const dfd = result.start();

    assert.equal(result.isPending, true);
    assert.equal(result.isResolved, false);
    assert.equal(result.isCanceled, false);
    assert.equal(result.isRejected, false);
    assert.equal(result.requestId, 'GAMMA');

    await dfd;

    assert.equal(result.isPending, false);
    assert.equal(result.isResolved, true);
    assert.equal(result.isCanceled, false);
    assert.equal(result.isRejected, false);
    assert.equal(result.requestId, 'GAMMA');

    assert.end();
  });

  t.test('can cancel a request', async (assert) => {
    let result;
    testHook(() => {
      result = useRequest(actionGamma);
    });

    assert.equal(result.isPending, false);
    assert.equal(result.isResolved, false);
    assert.equal(result.isCanceled, false);
    assert.equal(result.isRejected, false);
    assert.equal(result.requestId, undefined);

    result.start();

    assert.equal(result.isPending, true);
    assert.equal(result.isResolved, false);
    assert.equal(result.isCanceled, false);
    assert.equal(result.isRejected, false);
    assert.equal(result.requestId, 'GAMMA');

    await result.cancel();

    assert.equal(result.isPending, false);
    assert.equal(result.isResolved, false);
    assert.equal(result.isCanceled, true);
    assert.equal(result.isRejected, false);
    assert.equal(result.requestId, 'GAMMA');

    assert.end();
  });

  t.test('can cancel a resolved request', async (assert) => {
    let result;
    testHook(() => {
      result = useRequest(actionGamma);
    });

    assert.equal(result.isPending, false);
    assert.equal(result.isResolved, false);
    assert.equal(result.isCanceled, false);
    assert.equal(result.isRejected, false);
    assert.equal(result.requestId, undefined);

    await result.start();

    assert.equal(result.isPending, false);
    assert.equal(result.isResolved, true);
    assert.equal(result.isCanceled, false);
    assert.equal(result.isRejected, false);
    assert.equal(result.requestId, 'GAMMA');

    await result.cancel();

    assert.equal(result.isPending, false);
    assert.equal(result.isResolved, false);
    assert.equal(result.isCanceled, true);
    assert.equal(result.isRejected, false);
    assert.equal(result.requestId, 'GAMMA');

    assert.end();
  });
});
