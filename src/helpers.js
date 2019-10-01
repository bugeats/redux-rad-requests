const { DEFAULT_REQUESTS_REDUCER_KEY } = require('./constants');

// Makes a new selector that returns the status enum of the given request id
function generateStatusSelector (requestId, reducerKey = DEFAULT_REQUESTS_REDUCER_KEY) {
  return (state) => {
    if (state && state[reducerKey] && state[reducerKey][requestId]) {
      return state[reducerKey][requestId].status;
    }
    return undefined;
  };
}

module.exports = {
  generateStatusSelector
};
