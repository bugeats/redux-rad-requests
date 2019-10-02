# redux-rad-requests  

It's kinda crazy that we've been building react/redux apps with an async requests model that allows race conditions by default.

**redux-rad-requests** is small set of tools that give you a powerful and concise way to manage and respond to your React app's various requests and their state.

It relies on a couple very good ideas: Redux, React Hooks, Promises, and Selectors.

This project has **100% test coverage**.

Yes it works with react-native.


#### Why use it

- Use it to turn any async action into a *named request*
- Use it to prevent race conditions by dropping duplicate requests
- Use it to build nice UI logic around request status
- Use it to easily cancel and retry requests
- Use it to keep all state in Redux where it belongs
- Use it because you love React hooks and functional components


#### Why skip it

- Skip it if you're not using Redux and react-redux
- Skip it if you're not ready to use React hooks


## How it Looks

```jsx
import { useRequest } from 'redux-rad-request';

// Any React component that supports hooks
export default function MyApp () {
  const {
    start: handleButtonPress,
    isPending,
  } = useRequest(fetchSomething); // <-- HERE is the main hook

  const content = isPending
    ? <p>Loading something...</p>
    : <p>Your data is ready.</p>

  // mash this button all you want and never create a race condition
  return (
    <div>
      <button onPress={handleButtonPress}>Fetch Something</button>
      {content}
    </div>
  );
}

// A mostly normal Redux action creator
function fetchSomething () {
  return {
    type: 'FETCH_SOMETHING',
    meta: {
      requestId: 'FETCH_SOMETHING' // <-- HERE is where you name the request
    },
    async payload () {
      await pullOutAllTheStops();
      await battenDownTheHatches();
    }
  };
}
```

## Make it Go

Install the npm package:

    npm install --save redux-rad-requests

Or for you knitters out there:

    yarn add redux-rad-requests


You're going to need to do a tiny bit of manual integration. There's both a reducer and a middleware component that needs to be installed. It should all look something like this:

```javascript
// redux-store.js

import { applyMiddleware, combineReducers, createStore } from 'redux';

import {
  middleware as requestsMiddleware,
  reducer as requestsReducer
} from 'redux-rad-requests';

const reducers = combineReducers({
  // ...
  // your other reducers
  // ...
  requests: requestsReducer // <-- rad!
  // ...
  // your other reducers
  // ...
});

const middleware = applyMiddleware(
  // ...
  // your other redux middleware
  // ...
  requestsMiddleware() // <-- rad!
  // ...
  // your other redux middleware
  // ...
);

const store = createStore(reducers, middleware);

export default store;
```

## Usage

Here's the API real quick. See [the tests](src/) for details.

```javascript
import { useRequest, useRequestStatus } from 'redux-rad-requests';

// in your React functional components...

const {
  start, // a function that dispatches the request action
  cancel, // a function that cancels the current named request
  retry, // a function that retries a failed request
  deferred, // a reference directly to the interal promise object
  requestId, // the request id as found after dispatching the action
  isPending, // true if the named request is pending
  isResolved, // true if the named request has been resolved
  isRejected, // true if the named request failed
  isCanceled  // true if the name request was canceled
} = useRequest(function myActionCreator () {
  return {
    type: 'MY_ACTION',
    meta: {
      // this action property must exist to make it a valid request
      // request id is usually the same as the action type,
      // but can be different if needed.
      requestId: 'MY_ACTION'
    }
    // this action property must exist to make it a valid request
    async payload () {
      // do your work here
    }
  }
}) 

// meanwhile in some other component ...

const {
  isPending, // true if the named request is pending
  isResolved, // true if the named request has been resolved
  isRejected, // true if the named request failed
  isCanceled  // true if the name request was canceled
} = useRequestStatus('MY_ACTION')
```

`useRequestDispatcher` is also a thing, but that's varsity level.




## Get Thunky

While not required, **redux-rad-requests** plays very nicely with [`redux-thunk`](https://www.npmjs.com/package/redux-thunk) and [`redux-promise-middleware`](https://www.npmjs.com/package/redux-promise-middleware). Order your middleware something like this:

```javascript
import thunk from 'redux-thunk';
import { createPromise } from 'redux-promise-middleware';

import {
  middleware as requestsMiddleware
  PENDING, RESOLVED, REJECTED
} from 'redux-rad-requests';

// order matters here!
const middleware = applyMiddleware(
  thunk, // redux-thunk
  requestsMiddleware(), // redux-rad-requests
  createPromise({ // redux-promise-middleware
    // redux-promise-middlware uses slightly different names by default.
    // Here you can match the same status strings used by redux-rad-requests.
    promiseTypeSuffixes: [PENDING, RESOLVED, REJECTED],
  })
);

const store = createStore(reducers, middleware);
```

Now your action creators can look like this:

```javascript
function releaseTheHounds () {
  return dispatch => dispatch({ // <-- redux-thunk magic here
    type: RELEASE_THE_HOUNDS,
    meta: { requestId: RELEASE_THE_HOUNDS }, // <-- redux-rad-requests magic here
    async payload () { // <-- redux-promise-middlware magic here
      await dispatch(openGate());
      const hounds = await fetchHounds();
      return hounds;
    },
  });
}
```

## Contributing

Just do this please:

    npm test
    npm run lint

----

Did you know there's [two different ways of spelling canceled](https://www.grammarly.com/blog/canceled-vs-cancelled/)? English is dumb, but we do it the American way. :us:
