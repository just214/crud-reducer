## crud-reducer

### A simple utility library to help you manage CRUD, API or any other async operations with [redux](https://redux.js.org/).

#### `npm i crud-reducer`

Managing crud and other async operations with redux typically requires the following for each request:

1. Handling request data
2. Handling request errors
3. Handling pending requests (think spinners)

This library was designed to help with these common tasks and exposes two simple methods:

##### `crudReducer`

##### `crudAction`

## PLEASE READ

This library assumes that you already have `redux` and `redux-thunk` set up in your project. If not, this library may not be much use to you.

This library has not been exhaustively tested and is not recommended for production use yet. If you think it is useful and would like to contribute, please feel free.

### Getting started

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
});
```

**Step 3- Build action creators using the `crudAction` method.**

This methods accept two arguments:

    1. String- "reducerName.actionName"

    2. A function that returns a promise

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

Each reducer created with `crudReducer` will manage and store the data, pending state and errors for each request that is made with any of its corresponding `crudAction` methods. The store will be modeled based on the first string passed into your `crudAction` methods. (reducerName.actionName)

### State Model

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

| property | data type | details                                                                                                       |
| -------- | --------- | ------------------------------------------------------------------------------------------------------------- |
| data     | any       | If your promise resolves successfully, the data will be stored in the `reducerName.actionName.data` property. |
| pending  | Boolean   | `true` during request. `false` on resolve or reject. Stored in the `reducerName.actionName.pending` property. |
| error    | any       | If your promise rejects, the error will be stored in the `reducerName.actionName.error` property.             |

### Example

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
    this.props.fetchUsers();
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
