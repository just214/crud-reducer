const crudReducer = name => (state = {}, action) => {
  const reducerName = name.toUpperCase();
  const methodName = action.payload && action.payload.methodName;
  switch (action.type) {
    case `${reducerName}_ACTION_PENDING`:
      return Object.assign({}, state, {
        [`${methodName}`]: {
          pending: true,
          data: null,
          error: null,
        },
      });
    case `${reducerName}_ACTION_COMPLETE`:
      return Object.assign({}, state, {
        [`${methodName}`]: {
          pending: false,
          data: action.payload.data,
          error: null,
        },
      });
    case `${reducerName}_ACTION_ERROR`:
      return Object.assign({}, state, {
        [`${methodName}`]: {
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
      const reducerName = name.split('.')[0].toUpperCase();
      const methodName = name.split('.')[1];

      dispatch({
        type: `${reducerName}_ACTION_PENDING`,
        payload: { methodName },
      });

      if (callback.length) {
        const saveData = data => {
          dispatch({
            type: `${reducerName}_ACTION_COMPLETE`,
            payload: { methodName, data },
          });
        };
        callback(saveData);
      } else {
        callback()
          .then(data => {
            dispatch({
              type: `${reducerName}_ACTION_COMPLETE`,
              payload: { methodName, data },
            });
            resolve(data);
          })
          .catch(error => {
            dispatch({
              type: `${reducerName}_ACTION_ERROR`,
              payload: { methodName, error },
            });
            reject(error);
          });
      }
    });
  };
};

export { crudReducer, crudAction };
