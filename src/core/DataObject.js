'use strict';

let DebugObject = require('./DebugObject');

let DataObject = (params=undefined, event=undefined, isLoggable=false) => {
    let _DataObject = {event, params, locals: {data: {}}};
    _DataObject.calls = {lastCall: null};
    _DataObject.debug = DebugObject(_DataObject, isLoggable);
    _DataObject.localStorage = {};

    return _DataObject;
}

module.exports = DataObject;