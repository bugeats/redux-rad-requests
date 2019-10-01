const { useState } = require('react');

const useRequestDispatcher = require('./use-request-dispatcher');
const useRequestStatus = require('./use-request-status');

// This hook accepts an action creator function that returns
// an action in the format recognized by the requests middleware.

// Aggregates the useRequestDispatcher and useRequestStatus hooks.

function useRequest (actionCreator) {
  const [requestId, setRequestId] = useState();

  const dispatcher = useRequestDispatcher(actionCreator);
  const status = useRequestStatus(requestId);

  if (dispatcher.requestId !== undefined && dispatcher.requestId !== requestId) {
    setRequestId(dispatcher.requestId);
  }

  return {
    ...dispatcher,
    ...status
  };
}

// -----------------------------------------------------------------------------

module.exports = useRequest;
