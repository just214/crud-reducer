# crud-reducer

### A simple utility library to help you manage CRUD, API or any other async operations with [redux](https://redux.js.org/).

#### `npm i crud-reducer`

Managing async operations with redux typically requires:

1. Handling request data
2. Handling request errors
3. Handling pending requests (think spinners)

This library was designed to help with these common tasks and exposes two simple methods:

#### `crudReducer`

#### `crudAction`

### A WORD OF CAUTION

This library assumes that you already have `redux` and `redux-thunk` set up in your project. If not, this library may not be much use to you.

This library has not been exhaustively tested and is not recommended for production use yet. If you think it is useful and would like to contribute, please feel free.

### GETTING STARTED

**Step 1: Install crud-reducer**

`yarn add crud-reducer` or `npm i crud-reducer`

**Step 2- Create a reducer with the `crudReducer` method in your `combineReducer` function**

Each reducer can represent an individual dataset that you intend to query or mutate. The `crudReducer` method takes a single argument- the name that you chose for the reducer.

```js
import { combineReducers } from 'redux';
import { crudReducer } from 'crud-reducer';

export default combineReducers({
  users: crudReducer('users'),
});
```

**Step 3- Build action creators using the `crudAction` method.**

This methods accept two arguments:

1. **String:** "reducerName.actionName"

2. **Callback Function:** Must return a promise unless using `next()` (see 'More about crudAction' below)

If you need to modify the data before it is saved to your store, you can chain a `.then()` on your promise and return the modified value. You can do anything to the data in the `.then()` as long as it returns a value, which is what is ultimately saved to the store.

Don't worry about catching the errors. `crud-reducer` will take care of that for you. More on that in the 'STATE MODEL' section below.

```js
import axios from 'axios';
import { crudAction } from 'crud-reducer';

const fetchUsers = () =>
  crudAction('users.fetch', () =>
    axios
      .get('https://jsonplaceholder.typicode.com/users')
      .then(results => results.data),
  );
```

**Step 4 (for React apps)- Connect your newly created state and action creators to your components as normal.**

```js
import { connect } from 'react-redux';
import UserCardList from './UserCardList';
import { fetchUsers } from '../store/users';

const mapStateToProps = state => ({
  users: state.users.fetch,
});

export default connect(mapStateToProps, { fetchUsers })(UserCardList);
```

You now have access to `this.props.users.pending`, `this.props.users.data`, and `this.props.users.error`.

### STATE MODEL

Each reducer created with a `crudReducer` method will store the return data, pending state and error for each request made with any of it's corresponding `crudAction` methods. The store will be modeled based on the string passed into your `crudAction` method as a first argument. (reducerName.actionName)

```js
reducerName: {
  actionName: {
	data: <any>,
    pending: Boolean,
    error: <any>,
  },
  ...
}
```

#### actionName data details

The initial state represents the state at the time the corresponding `crudAction` is invoked. Until that time, these data properties do not exist. Trying to reference them before will result in an error.

The action types are dynamically created based on the reducer name that is passed into the `crudReducer` method. The `pending` action type will always be dispatched followed by either the `data` or `error` action type.

| Property      | Data Type | During Request | On resolve | On reject | Reducer model                    | Action type                   |
| ------------- | --------- | -------------- | ---------- | --------- | -------------------------------- | ----------------------------- |
| **`pending`** | `Boolean` | `true`         | `false`    | `false`   | `reducerName.actionName.pending` | `REDUCERNAME_ACTION_PENDING`  |
| **`data`**    | `<any>`   | `null`         | `<any>`    | `null`    | `reducerName.actionName.data`    | `REDUCERNAME_ACTION_COMPLETE` |
| **`error`**   | `<any>`   | `null`         | `null`     | `<any>`   | `reducerName.actionName.error`   | `REDUCERNAME_ACTION_ERROR`    |

### More about crudAction

##### `next()`

The `crudAction` method's callback accepts a `next()` argument that can be useful for sockets and subscriptions. The `next()` function allows you to pass it the final result of a re-occurring operation, which will update the store each time.

A couple things about the `next` function:

1. The name `next` is completely arbitrary and can be any name you would like. When you place a name as an argument, this tells the `crudReducer` that you intend to manually provide the value via the a function that it provides.
2. The `next` function is not able to track pending or error state as you are handling the async process outside of the method and providing the final return value.
3. Do not provide an argument name if you do not intend to use it as this will likely not give you the intended results.

In this example, we are calling the `next()` function with the results of a Firebase Realtime Database listener. Each time the db ref value changes (via the `.on()` method), the store will be updated automatically.

```js
const subscribeToUser = id =>
  crudAction('user.subscription', next => {
    return db.ref(`user/${id}`).on('value', next => {
      next(snap.val());
    });
  });
```

And the corresponding data model:

```js
user {
  subscription: {
    data: <any>
  }
}

// user.subscription.data
```

Here is the same example with the data being converted to an array before calling the `next()` function with the final array value as the argument. What ever is provided to the `next()` function is exactly what will be saved in the store. In this example, the data would be available at `user.subscription.data`.

```js
const subscribeToUser = id =>
  crudAction('user.subscription', next => {
    return db.ref(`user/${id}`).on('value', next => {
      const result = snap.val();
      let finalArray = [];
      if (result !== null) {
        Object.keys(result).forEach(key => {
          finalArray = [...finalArray, { ...result[key], key }];
        });
      }
      next(finalArray);
    });
  });
```

##### crudReducer returns a Promise

Any action creator that returns a `crudAction` returns a promise when invoked. This promise either resolves with an object containing the redux-thunk `dispatch` function and request data or rejects with the `dispatch` function and the error.

The request data and error values are also available in the store and accessing them through the `connect` HOC is usually the better approach. However, this promise can be useful if you want to wait for the request before doing something else in your component like calling another action creator.

```js
// in a React component

componentDidMount() {
	this.props.someCrudAction(id)
	  .then(({dispatch, data}) => {
	  	// do something after the crudAction resolves
	  })
	  .catch(({dispatch, error}) => {
	  	// do something after the crudAction rejects
	  })
}
```

### EXAMPLE

Here is a simple React example that uses the `crudReducer` and `crudAction` defined above to render a list of users returned from the JSONPlaceholder API.

This React component only renders the list if the `pending` state is false and there are no errors. If the `pending` state is true, a "loading" message is displayed. If there is an error, it shows the returned error message from `Axios`. Otherwise, the component is rendered with the data.

```js
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { fetchUsers } from '../../store/users';

const UserCardItem = ({ data }) => {
  return (
    <div>
      <h3>{data.name}</h3>
      <p>{data.email}</p>
    </div>
  );
};

UserCardItem.propTypes = {
  data: PropTypes.object.isRequired,
};

class UserCard extends Component {
  componentDidMount() {
    this.props
      .fetchUsers()
      .then(({ dispatch, data }) => {
        // the crudReducer returns a promise just in case you need it.
        // the data is returned, however, is saved in the store and
        // available at this.props.users.data.
      })
      .catch(({ dispatch, error }) => {
        // the crudReducer returns a promise just in case you need it.
        // the error is returned, however, is saved in the store and
        // available at this.props.users.error.
      });
  }
  render() {
    const { users } = this.props;

    if (!users) {
      return <p>No data</p>;
    }

    if (users.pending) {
      return <p>Loading</p>;
    }

    if (users.error) {
      return <p>{users.error.message}</p>;
    } else
      return (
        <div>
          {users.data.map(user => <UserCardItem key={user.id} data={user} />)}
        </div>
      );
  }
}

UserCard.propTypes = {
  fetchUsers: PropTypes.func.isRequired,
  users: PropTypes.object,
};

const mapStateToProps = state => ({
  users: state.users.fetch,
});

export default connect(mapStateToProps, { fetchUsers })(UserCard);
```

Made with :green_heart: by a vegan
