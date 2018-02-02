'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var crudReducer = function crudReducer(name) {
  return function () {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var action = arguments[1];

    var reducerName = name.toUpperCase();
    var methodName = action.payload && action.payload.methodName;
    switch (action.type) {
      case reducerName + '_ACTION_PENDING':
        return Object.assign({}, state, _defineProperty({}, '' + methodName, {
          pending: true,
          data: null,
          error: null
        }));
      case reducerName + '_ACTION_COMPLETE':
        return Object.assign({}, state, _defineProperty({}, '' + methodName, {
          pending: false,
          data: action.payload.data,
          error: null
        }));
      case reducerName + '_ACTION_ERROR':
        return Object.assign({}, state, _defineProperty({}, '' + methodName, {
          pending: false,
          data: state.data,
          error: action.payload.error
        }));
      default:
        return state;
    }
  };
};

var crudAction = function crudAction(name, promise) {
  return function (dispatch) {
    var reducerName = name.split('.')[0].toUpperCase();
    var methodName = name.split('.')[1];
    dispatch({
      type: reducerName + '_ACTION_PENDING',
      payload: { methodName: methodName }
    });

    promise().then(function (data) {
      dispatch({
        type: reducerName + '_ACTION_COMPLETE',
        payload: { methodName: methodName, data: data.results }
      });
    }).catch(function (error) {
      dispatch({
        type: reducerName + '_ACTION_ERROR',
        payload: { methodName: methodName, error: error }
      });
    });
  };
};

exports.crudReducer = crudReducer;
exports.crudAction = crudAction;