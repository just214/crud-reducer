const crudReducer = name => (state = {}, action) => {
  const actionName = action.payload && action.payload.actionName;

  const reducerName = action.payload
    ? `${name.toUpperCase()}.${action.payload.actionName.toUpperCase()}`
    : name.toUpperCase();

  switch (action.type) {
    case `${reducerName}_PENDING`:
      return Object.assign({}, state, {
        [`${actionName}`]: {
          pending: true,
          data: null,
          error: null,
        },
      });
    case `${reducerName}_COMPLETE`:
      return Object.assign({}, state, {
        [`${actionName}`]: {
          pending: false,
          data: action.payload.data,
          error: null,
        },
      });
    case `${reducerName}_ERROR`:
      return Object.assign({}, state, {
        [`${actionName}`]: {
          pending: false,
          data: state.data,
          error: action.payload.error,
        },
      });
    default:
      return state;
  }
};

const crudAction = (name, callback) => {
  return dispatch => {
    return new Promise((resolve, reject) => {
      const reducerName = name.toUpperCase();
      const actionName = name.split('.')[1];

      dispatch({
        type: `${reducerName}_PENDING`,
        payload: { actionName },
      });

      if (callback.length) {
        const saveData = data => {
          dispatch({
            type: `${reducerName}_COMPLETE`,
            payload: { actionName, data },
          });
          resolve({ dispatch, data });
        };
        callback(saveData);
      } else {
        callback()
          .then(data => {
            dispatch({
              type: `${reducerName}_COMPLETE`,
              payload: { actionName, data },
            });
            resolve({ dispatch, data });
          })
          .catch(error => {
            dispatch({
              type: `${reducerName}_ERROR`,
              payload: { actionName, error },
            });
            reject({ dispatch, error });
          });
      }
    });
  };
};

export { crudReducer, crudAction };
