const {
  applyMiddleware,
  combineReducers,
  createStore
} = require('redux');

const {
  middleware: requestsMiddleware,
  reducer: requestsReducer
} = require('../index');

const reducers = combineReducers({
  requests: requestsReducer
});

const middleware = applyMiddleware(requestsMiddleware());

const store = createStore(reducers, middleware);

// -----------------------------------------------------------------------------

module.exports = store;
