const test = require('tape');
const { applyMiddleware, combineReducers, createStore } = require('redux');

const middleware = require('./middleware');
const reducer = require('./reducer');
const { CANCELED, PENDING, REJECTED, RESOLVED } = require('./constants');
const { generateStatusSelector } = require('./helpers');

// -----------------------------------------------------------------------------

function makeTestStore () {
  return createStore(
    combineReducers({
      requests: reducer
    }),
    applyMiddleware(
      middleware()
    )
  );
}

async function wait (ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

// Actions ---------------------------------------------------------------------

function actionAlpha () {
  return {
    type: 'ACTION_ALPHA',
    meta: { requestId: 'ACTION_ALPHA' },
    async payload () {
      await wait(200);
      return 'alpha-results';
    }
  };
}

function actionBeta () {
  return {
    type: 'ACTION_BETA',
    meta: { requestId: 'ACTION_BETA' },
    async payload () {
      await wait(190);
      return 'beta-results';
    }
  };
}

// -----------------------------------------------------------------------------

test('requests dispatch result has generated functions', async (assert) => {
  const store = makeTestStore();
  const result = store.dispatch(actionAlpha());

  assert.ok(result.deferred instanceof Promise);
  assert.ok(result.cancel instanceof Function);
  assert.ok(result.retry instanceof Function);
  assert.equal(result.requestId, 'ACTION_ALPHA');

  assert.end();
});

test('requests dispatch resolves multiple actions', async (assert) => {
  const store = makeTestStore();

  await Promise.all([
    store.dispatch(actionAlpha()),
    store.dispatch(actionBeta()),
    store.dispatch(actionAlpha()),
    store.dispatch(actionBeta()),
    store.dispatch(actionAlpha()),
    store.dispatch(actionBeta())
  ]);

  assert.deepEqual(store.getState(), {
    requests: {
      ACTION_ALPHA: {
        status: RESOLVED
      },
      ACTION_BETA: {
        status: RESOLVED
      }
    }
  });

  assert.end();
});

test('requests can be canceled', async (assert) => {
  const store = makeTestStore();

  let didStart = false;
  let favoriteNumber = 13;

  const { cancel } = store.dispatch({
    type: 'CANCELABLE',
    meta: { requestId: 'CANCELABLE' },
    async payload () {
      didStart = true;
      await wait(200);
      favoriteNumber = 7;
    }
  });

  await wait(100);

  cancel();

  assert.equal(didStart, true);
  assert.equal(favoriteNumber, 13);

  assert.deepEqual(store.getState(), {
    requests: {
      CANCELABLE: {
        status: CANCELED
      }
    }
  });

  assert.end();
});

test('requests serial concurrency', async (assert) => {
  const store = makeTestStore();

  let didStartOne = false;
  let didStartTwo = false;
  let didStartThree = false;

  const { deferred: deferredOne } = store.dispatch({
    type: 'RACE_FOR_THE_PRIZE',
    meta: { requestId: 'RACE_FOR_THE_PRIZE' },
    async payload () {
      didStartOne = true;
      await wait(200);
      return 'one';
    }
  });

  const { deferred: deferredTwo } = store.dispatch({
    type: 'RACE_FOR_THE_PRIZE',
    meta: { requestId: 'RACE_FOR_THE_PRIZE' },
    async payload () {
      didStartTwo = true;
      await wait(200);
      return 'two';
    }
  });

  await Promise.all([
    deferredOne,
    deferredTwo
  ]);

  assert.equal(didStartOne, true);
  assert.equal(didStartTwo, false);

  // The first two requests are complete (one was never started),
  // and now a third request should be able to start again.

  const { deferred: deferredThree } = store.dispatch({
    type: 'RACE_FOR_THE_PRIZE',
    meta: { requestId: 'RACE_FOR_THE_PRIZE' },
    async payload () {
      didStartThree = true;
      await wait(200);
      return 'three';
    }
  });

  assert.equal(didStartThree, true);

  const resultThree = await deferredThree;

  assert.equal(resultThree, 'three');

  assert.deepEqual(store.getState(), {
    requests: {
      RACE_FOR_THE_PRIZE: {
        status: RESOLVED
      }
    }
  });

  assert.end();
});

test('requests status resolved', async (assert) => {
  const store = makeTestStore();
  const { deferred } = store.dispatch({
    type: 'CALL_THE_GUARDS',
    meta: { requestId: 'CALL_THE_GUARDS' },
    async payload () {
      await wait(200);
    }
  });

  const statusSelector = generateStatusSelector('CALL_THE_GUARDS');
  assert.equal(statusSelector(store.getState()), PENDING);
  await deferred;
  assert.equal(statusSelector(store.getState()), RESOLVED);

  assert.end();
});

test('requests gate selector canceled', async (assert) => {
  const store = makeTestStore();

  const { cancel } = store.dispatch({
    type: 'CALL_THE_GUARDS',
    meta: { requestId: 'CALL_THE_GUARDS' },
    async payload () {
      await wait(200);
    }
  });

  const statusSelector = generateStatusSelector('CALL_THE_GUARDS');
  assert.equal(statusSelector(store.getState()), PENDING);
  cancel();
  assert.equal(statusSelector(store.getState()), CANCELED);

  assert.end();
});

test('requests gate selector failed', async (assert) => {
  const store = makeTestStore();

  const { deferred } = store.dispatch({
    type: 'CALL_THE_GUARDS',
    meta: { requestId: 'CALL_THE_GUARDS' },
    async payload () {
      await wait(200);
      return Promise.reject();
    }
  });

  const statusSelector = generateStatusSelector('CALL_THE_GUARDS');
  assert.equal(statusSelector(store.getState()), PENDING);

  try {
    await deferred;
  } catch (err) {
    assert.equal(statusSelector(store.getState()), REJECTED);
  }

  assert.end();
});

test('requests retry from rejected', async (assert) => {
  const store = makeTestStore();
  let tryCount = 0;

  const { retry, deferred } = store.dispatch({
    type: 'ELECT_A_COMPETENT_LEADER',
    meta: { requestId: 'ELECT_A_COMPETENT_LEADER' },
    async payload () {
      tryCount += 1;
      await wait(200);
      if (tryCount >= 2) {
        return 'all good';
      }
      throw new Error('not this again');
    }
  });

  try {
    await deferred;
  } catch (err) {
    assert.equal(tryCount, 1);
    assert.equal(err.message, 'not this again');
  }

  const result = await retry();
  assert.equal(tryCount, 2);
  assert.equal(result, 'all good');

  await Promise.all([
    retry(),
    retry(),
    retry(),
    retry(),
    retry()
  ]);

  assert.equal(tryCount, 3);

  assert.end();
});

test('request only once', async (assert) => {
  const store = makeTestStore();
  let count = 0;

  function boopCount () {
    return {
      type: 'BOOP_COUNT',
      meta: {
        requestId: 'BOOP_COUNT',
        requestOnlyOnce: true
      },
      async payload () {
        if (count === 0) {
          count += 1;
          throw new Error('do not boop me!');
        }
        count += 1;
      }
    };
  }

  try {
    await store.dispatch(boopCount());
  } catch (err) {
    // noop
  }

  assert.equal(store.getState().requests.BOOP_COUNT.status, REJECTED);
  assert.equal(count, 1);

  try {
    await store.dispatch(boopCount());
  } catch (err) {
    // noop
  }

  assert.equal(count, 2);

  try {
    await store.dispatch(boopCount());
  } catch (err) {
    // noop
  }

  assert.equal(count, 2);

  try {
    await store.dispatch(boopCount());
  } catch (err) {
    // noop
  }

  assert.equal(count, 2);
  assert.equal(store.getState().requests.BOOP_COUNT.status, RESOLVED);

  assert.end();
});
