const { useState } = require('react');
const { testHook } = require('../test/test-utils');
const test = require('tape');

const useRequestDispatcher = require('./use-request-dispatcher');

function actionAlpha () {
  return {
    type: 'ALPHA',
    meta: { requestId: 'ALPHA' },
    async payload () {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'alpha';
    }
  };
}

function actionZeta (msg) {
  return {
    type: 'ZETA',
    meta: { requestId: 'ZETA' },
    async payload () {
      await new Promise(resolve => setTimeout(resolve, 100));
      return `zeta-${msg}`;
    }
  };
}

// -----------------------------------------------------------------------------

test('useRequestDispatcher', (t) => {
  t.test('should return expected methods', (assert) => {
    const methods = testHook(() => useRequestDispatcher(actionAlpha));
    ['start', 'cancel', 'retry'].forEach((method) => {
      assert.ok(methods[method] instanceof Function);
    });

    assert.end();
  });

  t.test('should offer a promise', async (assert) => {
    // the callback to testHook is called every time the hook triggers a component re-render
    let methods;
    testHook(() => {
      methods = useRequestDispatcher(actionAlpha);
    });
    assert.ok(methods.deferred instanceof Promise);
    await methods.deferred;
    const startResult = await methods.start();
    assert.equal(startResult, 'alpha');
    const deferredResult = await methods.deferred;
    assert.equal(deferredResult, 'alpha');

    assert.end();
  });

  t.test('start method should be replay\'able', async (assert) => {
    // the callback to testHook is called every time the hook triggers a component re-render
    let methods;
    testHook(() => {
      methods = useRequestDispatcher(actionAlpha);
    });
    const startResult1 = await methods.start();
    assert.equal(startResult1, 'alpha');
    const startResult2 = await methods.start();
    assert.equal(startResult2, 'alpha');

    assert.end();
  });

  t.test('action creator closures are updated', async (assert) => {
    // the callback to testHook is called every time the hook triggers a component re-render
    let methods;
    let setFoo;
    testHook(() => {
      const [foo, _setFoo] = useState('qoph');
      setFoo = _setFoo;
      methods = useRequestDispatcher(() => actionZeta(foo));
    });
    const startResult1 = await methods.start();
    assert.equal(startResult1, 'zeta-qoph');
    setFoo('reticuli');
    const startResult2 = await methods.start();
    assert.equal(startResult2, 'zeta-reticuli');

    assert.end();
  });

  t.test('result has requestId', async (assert) => {
    // the callback to testHook is called every time the hook triggers a component re-render
    let methods;
    testHook(() => {
      methods = useRequestDispatcher(() => actionZeta());
    });
    assert.equal(methods.requestId, undefined);
    await methods.start();
    assert.equal(methods.requestId, 'ZETA');

    assert.end();
  });

  t.test('throws error with bogus action creator', async (assert) => {
    // the callback to testHook is called every time the hook triggers a component re-render
    testHook(() => {
      assert.throws(() => {
        useRequestDispatcher('my cat\'s breath smells like cat food');
      });
    });

    assert.end();
  });
});
