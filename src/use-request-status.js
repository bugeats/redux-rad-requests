const { useSelector } = require('react-redux');

const {
  CANCELED,
  PENDING,
  REJECTED,
  RESOLVED
} = require('./constants');

const { generateStatusSelector } = require('./helpers');

// -----------------------------------------------------------------------------

function useRequestStatus (requestId) {
  const statusSelector = generateStatusSelector(requestId);
  const status = useSelector(statusSelector);
  return {
    status,
    isPending: status === PENDING,
    isResolved: status === RESOLVED,
    isRejected: status === REJECTED,
    isCanceled: status === CANCELED
  };
}

// -----------------------------------------------------------------------------

module.exports = useRequestStatus;
