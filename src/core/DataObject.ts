import DebugObject from './DebugObject';

interface Data {
  local: any // stuff at level of scope
  add('myVar')
  get('myVar')
}

let DataObject = (params=undefined, event=undefined, isLoggable=false) => {
    let _DataObject = {event, params, locals: {data: {}}};
    _DataObject.calls = {lastCall: null};
    _DataObject.debug = DebugObject(_DataObject, isLoggable);
    _DataObject.localStorage = {};

    return _DataObject;
};

export default DataObject;
