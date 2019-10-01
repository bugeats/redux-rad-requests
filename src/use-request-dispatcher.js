const { useState } = require('react');
const { useDispatch } = require('react-redux');

// This hook accepts an action creator function that returns
// an action in the format recognized by the requests middleware.

function useRequestDispatcher (actionCreator) {
  if (typeof actionCreator !== 'function') {
    throw new Error('useRequest takes a reference to an action creator function');
  }

  const dispatch = useDispatch();

  // Match (and extend) the standard request middleware methods so their signature
  // may be used before the request action has actually been dispatched.
  const initialMethods = {
    deferred: Promise.resolve(),
    cancel: () => {},
    retry: () => {},
    requestId: undefined
  };

  // We re-define this function every time useRequestDispatcher is called because
  // actionCreator may have been a closure that has updated context.
  function start (...args) {
    const startDispatchResult = dispatch(actionCreator(...args));
    setDispatchResult({ // eslint-disable-line no-use-before-define
      ...initialMethods,
      ...startDispatchResult
    });
    return startDispatchResult;
  }

  const [dispatchResult, setDispatchResult] = useState(initialMethods);

  // This is returned every time the store state is updated
  // or whenever the initial dispatch has started.
  return {
    ...dispatchResult,
    ...{ start }
  };
}

// -----------------------------------------------------------------------------

module.exports = useRequestDispatcher;
