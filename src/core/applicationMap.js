'use strict';

let DataObject      = require("./DataObject");
let AppObject       = require("./AppObject");
let emitter         = require("../globalEmitter");
let ChoiceBlock     = require('./core').ChoiceBlock;
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

_applicationMap.doBefore = (...middleware) => {
    if(_doBefore)
        throw(new Error('Do before scope has already been set!'));
    _doBefore = Scope(true);
    return ChoiceBlock(_doBefore).do.apply(null, middleware);
};

_applicationMap.doAfter = (...middleware) => {
    if(_doAfter)
        throw(new Error('Do before scope has already been set!'));
    _doAfter = Scope(true);
    return ChoiceBlock(_doAfter).do.apply(null, middleware);
};


let mapEventAndReturnChoice = (events, isLoggable=true, isOnce=false) => {
    let scope = Scope();
    let doBefore = _doBefore || Scope();
    let doAfter = _doAfter || Scope();

    // now add listeners to events from application configs
    events.forEach(event => emitter.on(event).to( (event, params) => {
        params = params || {};

        let data = DataObject(params, event, isLoggable);
        let app = AppObject(_model, _service, _events);

        isLoggable && data.debug.log("EMITTED  |-------------->  " + event);

        doBefore.run(data, app,
            (data, app) => scope.run(data, app,
                (data, app) => doAfter.run(data, app, (data, app) => {
                    isLoggable && data.debug.log('COMPLETE |<--------------  ' + event);
                })));
    }));

    return ChoiceBlock(scope);
}

_applicationMap.withParams = (isLoggable=true, isOnce=false) => {
    return {
        on : (...events) => {
            return mapEventAndReturnChoice(events, isLoggable, isOnce);
        }
    }
};

_applicationMap.on = (...events) => {
    events.forEach(event => {
        if(!_.isString(event)){
            throw(new Error('Event mus be a string, not ' + typeof event + '!'));
        }
    })
    return mapEventAndReturnChoice(events);
};


_applicationMap.enableLogging = () => {
    _loggingIsEnabled = true;
};

_applicationMap.disableLogging = () => {
    _loggingIsEnabled = false;
};

module.exports = _applicationMap;