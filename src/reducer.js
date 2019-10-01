const { ACTION } = require('./constants');

function reducer (state = {}, action) {
  if (action.type === ACTION) {
    const { requestId, status } = action.payload;
    const stateX = {};
    stateX[requestId] = { status };
    return { ...state, ...stateX };
  }

  return state;
}

module.exports = reducer;
