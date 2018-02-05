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

### PLEASE READ

This library assumes that you already have `redux` and `redux-thunk` set up in your project. If not, this library may not be much use to you.

This library has not been exhaustively tested and is not recommended for production use yet. If you think it is useful and would like to contribute, please feel free.

### GETTING STARTED

**Step 1: Install crud-reducer**

`yarn add crud-reducer` or `npm i crud-reducer`

**Step 2- Create a reducer with the `crudReducer` method in your `combineReducer` function**

Each reducer should represent an individual data set that you intend to query or mutate. The `crudReducer` method takes a single argument- the name that you chose for the reducer.

```js
import { combineReducers } from 'redux';
import { crudReducer } from 'crud-reducer';

const users = crudReducer('users');

export default combineReducers({
  users,
  // or users: crudReducer('users')
});
```

**Step 3- Build action creators using the `crudAction` method.**

This methods accept two arguments:

    1. String: "reducerName.actionName"

    2. Function: Must return a promise

If you need to modify the data before it is saved to your store, just chain a `.then()` on your promise and return the modified value. You can do anything to the data in the `.then()` as long as it returns a value, which is what is ultimately saved to the store.

Don't worry about catching the errors. `crud-reducer` will take care of that for you.

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
  users: state.users,
});

export default connect(mapStateToProps, { fetchUsers })(UserCardList);
```

### More about crudAction

##### Subscriptions

The `crudAction` method accepts a `next` argument that can be useful for sockets and subscriptions. The `next` function allows you to pass the final result of a re-occurring operation, which will update the store each time.

A couple things about the `next` function:

1. The name `next` is completely arbitrary and can be any name you would like. When you place a name as an argument, this tells the `crudReducer` that you intend to manually provide the value via the a function that it provides.
2. The `next` function is not able to track pending or error state as you are handling the async process outside of the method and providing the final return value.
3. Do not provide an argument name if you do not intend to use it as this will likely not give you the intended results.

In this example, we are calling the `next` function with the results of a Firebase Realtime Database listener. Each time the db ref value changes (via the `.on` method), the store will be updated automatically.

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
```

##### Returns a Promise

Any action creator created with a `crudAction` method returns a promise, which resolves with the data from the request or rejects with the error. These values (data, error, and pending) are also available in the store and accessing them through the `connect` HOC is usually the more convenient approach. However, this promise can be useful if you want to wait for the request before doing something else in your component.

### STATE MODEL

Each reducer created with `crudReducer` will manage and store the data, pending state and error for each request that is made with any of its corresponding `crudAction` methods. The store will be modeled based on the first string passed into your `crudAction` methods. (reducerName.actionName)

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

| property | data type | details                                                                                                       | action dispatched           |
| -------- | --------- | ------------------------------------------------------------------------------------------------------------- | --------------------------- |
| data     | any       | If your promise resolves successfully, the data will be stored in the `reducerName.actionName.data` property. | REDUCERNAME_ACTION_COMPLETE |
| pending  | Boolean   | `true` during request. `false` on resolve or reject. Stored in the `reducerName.actionName.pending` property. | REDUCERNAME_ACTION_PENDING  |
| error    | any       | If your promise rejects, the error will be stored in the `reducerName.actionName.error` property.             | REDUCERNAME_ACTION_ERROR    |

### EXAMPLE

Here is a simple React example that uses the `crudReducer` and `crudAction` defined above to render a list of users returned from the JSONPlaceholder API.

This component only renders the list if the `pending` state is false and there are no errors. If the `pending` state is true, a "loading" message is displayed. If there is an error, it shows the returned error message from `Axios`. Otherwise, the component is rendered with the data.

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
    this.props.fetchUsers().then(data => {
      // the crudReducer returns a promise just in case you need it.
    });
  }
  render() {
    const { users } = this.props;

    if (!users.fetch) {
      return <p>No data</p>;
    }

    if (users.fetch.pending) {
      return <p>Loading</p>;
    }

    if (users.fetch.error) {
      return <p>{users.fetch.error.message}</p>;
    } else
      return (
        <div>
          {users.fetch.data.map(user => (
            <UserCardItem key={user.id} data={user} />
          ))}
        </div>
      );
  }
}

UserCard.propTypes = {
  fetchUsers: PropTypes.func.isRequired,
  users: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  users: state.users,
});

export default connect(mapStateToProps, { fetchUsers })(UserCard);
```

Made with :green_heart: by a vegan
