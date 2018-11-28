'use strict';

let DataObject      = require("./DataObject");
let AppObject       = require("./AppObject");
let emitter         = require("../globalEmitter");
let ChoiceWrapper    = require('./core').ChoiceWrapper;
let Scope           = require('./core').Scope;
let _               = require('lodash');


let _applicationMap         = {};
let _doBefore               = null;
let _doAfter                = null;
let _componentMixins        = [];
let _loggingIsEnabled       = false;
let _service                = {};
let _events                 = {};
let _model                  = { clear: () => Object.keys(_model).forEach( key => {
                                      _.isFunction(_model[key]['clear']) && _model[key].clear();
                                  })
                              };

// app object definitions

_applicationMap.registerModel = (modelName, model) => {
    if(_model[modelName]) throw(new Error('Model', modelName, 'already registered!'));
    Object.defineProperty(_model, modelName, { value:model, writable: false, enumerable: true });
};

_applicationMap.registerService = (serviceName, service) => {
    if(_service[serviceName]) throw(new Error('Service', serviceName, 'already registered!'));
    Object.defineProperty(_service, serviceName, { value:service, writable: false, enumerable: true });
};

_applicationMap.registerEvent = (eventsName, event) => {
    if(_events[eventsName]) throw(new Error('Event', eventsName, 'already registered!'));
    Object.defineProperty(_events, eventsName, { value:event, writable: false, enumerable: true });
};

_applicationMap.registerEventsByObject = eventsObject => {
    Object.keys(eventsObject).forEach(key => {
        if(_events[key]) throw(new Error('Event with key', key,'already registered!'));
        Object.defineProperty(_events, key, { value:eventsObject[key], writable: false, enumerable: true });
    });
};

_applicationMap.addComponentMixin = mixin => {
    _componentMixins[_componentMixins.length] = mixin;
};

Object.defineProperties(_applicationMap, {
    componentMixins: { get: () => _componentMixins },
    loggingIsEnabled: { get: () => _loggingIsEnabled }
});

_applicationMap.doBefore = scope => {
    if(_doBefore)
        throw new Error('Do before scope has already been set!');
    _doBefore = Scope();
    return scope(ChoiceWrapper(_doBefore));
};

_applicationMap.doAfter = scope => {
    if(_doAfter)
        throw new Error('Do before scope has already been set!');
    _doAfter = Scope();
    return scope(ChoiceWrapper(_doAfter));
};

let _queue = [];

_applicationMap.on = (events, scope, isLoggable=true, isOnce=false, skipBefore=false, skipAfter=false) => {
    if(_.isString(events)) events = [events];
    if(!_.isArray(events)) throw new Error('"events" must be a string, or an array of strings!');

    if(!_.isFunction(scope) || scope.length !== 1)
        throw(new Error('"scope" must be a method accepting a single argument!'));

    events.forEach(event => {
        if(!_.isString(event))
            throw new Error(`"events" arrays must contain only strings, not ${typeof event}!`);
    });

    // TODO - refactor the before / after stuff as is a bit whack at the moment
    let doBefore = skipBefore === true || _.isNil(_doBefore) ? Scope() : _doBefore;
    let doAfter  = skipAfter  === true || _.isNil(_doAfter)  ? Scope() : _doAfter;

    let runMethod = (params, event) => {
        params = params || {};

        let data = DataObject(params, event, isLoggable);
        let app = AppObject(_model, _service, _events);

        isLoggable && data.debug.log("EMITTED  |-------------->  " + event);
        isLoggable && data.debug.log("with params  |---------->  ", params);

        // TODO - I could cash the scopes so it doesn't need to
        // add children etc every time
        let newScope = Scope(event);
        newScope.setObjects(data, app);

        scope(ChoiceWrapper(newScope));

        doBefore.run(data, app,
            (data, app) => newScope.run(data, app,
                (data, app) => doAfter.run(data, app,
                    (data, app) => {
                        isLoggable && data.debug.log('COMPLETE |<--------------  ' + event);
                    /*if(_queue.length){
                        _queue.shift();
                        let nextInQueue = _queue[0];
                        nextInQueue && nextInQueue();
                    }*/
                }
        )));
    };

/*    let sortQueue = runMethod => (params, event) => {
        let method = () => runMethod(params, event);

        _queue[_queue.length] = method;

        if(_queue.length === 1){
            method();
        }

    };*/

    // now add listeners to events from application configs
    events.forEach(event => emitter.on(event).to(/*sortQueue(*/runMethod/*)*/).once(isOnce));

    return scope;
};


_applicationMap.enableLogging = () => {
    _loggingIsEnabled = true;
};

_applicationMap.disableLogging = () => {
    _loggingIsEnabled = false;
};

module.exports = _applicationMap;