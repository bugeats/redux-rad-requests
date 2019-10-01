const {
  ACTION,
  PENDING,
  RESOLVED,
  REJECTED,
  CANCELED
} = require('./constants');

const { generateStatusSelector } = require('./helpers');

// -----------------------------------------------------------------------------

const forever = Promise.race.bind(Promise, []); // a mighty long time

function internalAction (requestId, status) {
  return {
    type: ACTION,
    payload: {
      requestId,
      status
    }
  };
}

function isRequestAction (action) {
  return !!((action.meta && typeof action.meta.requestId === 'string')
    && (action.payload && typeof action.payload === 'function'));
}

// Handler ---------------------------------------------------------------------

function generateHandler (options) {
  const { requestsMap } = options;

  return store => next => (action) => { // eslint-disable-line no-unused-vars
    if (!isRequestAction(action)) {
      return next(action); // ignore actions that are not set as requests
    }

    const { requestId, requestOnlyOnce } = action.meta;

    if (requestOnlyOnce) {
      const status = generateStatusSelector(requestId)(store.getState());
      if (status === RESOLVED) {
        // discard request actions we want to dispatch only once.
        // like seriously just drop them into a void.
        return undefined;
      }

    }

    function handleResolve () {
      requestsMap.delete(requestId);
      store.dispatch(internalAction(requestId, RESOLVED));
    }

    function handleReject () {
      requestsMap.delete(requestId);
      store.dispatch(internalAction(requestId, REJECTED));
    }

    function handleRetry () {
      // Since retry is just re-dispatching the named request action,
      // all the concurrency protections are already in place. Easy.
      return store.dispatch(action);
    }

    // -----------------------------------

    const wrapperExtant = requestsMap.get(requestId);

    if (wrapperExtant) {
      // skip calling next(action) and return existing wrapper
      // action.payload() is never called, the duplicate request is never started,
      // and the overly eager action is swallowed by the abyss.
      return wrapperExtant;
    }

    let handleCancel;

    // wrapper is the result returned from dispatch().
    // It's a promise extended with extra properties.
    const wrapper = new Promise((resolve) => {
      // new Promise construction is actually synchronous so we can do stuff like this.
      // Generate a function to cancel the request completely.
      handleCancel = () => {
        resolve(forever());
        store.dispatch(internalAction(requestId, CANCELED));
      };

      // !!! Kick off the async action payload now !!!
      const deferredPayload = action.payload();
      store.dispatch(internalAction(requestId, PENDING));
      return resolve(deferredPayload);
    });

    wrapper.then(handleResolve, handleReject);

    // Here's the public interface of generated functions.
    wrapper.deferred = wrapper; // self-reference to the main wrapper
    wrapper.cancel = handleCancel;
    wrapper.retry = handleRetry;
    wrapper.requestId = requestId;

    requestsMap.set(requestId, wrapper);

    // Call the next middleware (which is probably redux-promise-middlware).
    next({
      ...action,
      // Convert the payload from an async function to the newly pending promise
      // redux-promise-middleware can then do its thing.
      payload: wrapper
    });

    return wrapper; // dispatch() always returns a promise
  };
}

// Middleware ------------------------------------------------------------------

function middleware (opts = {}) {
  const options = {
    // Keep a registry (scoped to middleware instance) of requests outside the store state
    // because requests are bound to time, and the store state must be able to time travel.
    requestsMap: new Map(),
    ...opts
  };
  return generateHandler(options);
}

// -----------------------------------------------------------------------------

module.exports = middleware;
