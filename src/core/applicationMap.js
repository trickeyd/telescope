'use strict';

let HashMap         = require('../HashMap');
let emitter         = require("../globalEmitter");
let assetManager    = require("../assetManager");
let ChoiceBlock     = require('./core').ChoiceBlock;
let Scope           = require('./core').Scope;
let _               = require('lodash');


let _applicationMap = {};

let _app = {};
let _configs = [];
let _modelMap = HashMap();
let _doBefore = null;
let _doAfter = null;
let _componentMixins = [];
let _loggingIsEnabled = false;

let _model = {
    clear: () => Object.keys(_model).forEach( key => _.isFunction(_model[key]['clear']) && _model[key].clear())
};

// app object definitions

Object.defineProperties(_app, {
    model: {  value: _model, writable: false,  enumerable: true },
    service: { value: {}, writable: false, enumerable: true },
    events: { value: {}, writable: false, enumerable: true },
    emitter: { value: emitter, writable: false, enumerable: true },
    assetManager: { value: assetManager, writable: false, enumerable: true },
    map: { value: this, writable: false, enumerable: true }
});

_applicationMap.registerModel = (modelName, model) => {
    if(_app.model[modelName]) throw(new Error('Model', modelName, 'already registered!'));
    Object.defineProperty(_app.model, modelName, { value:model, writable: false, enumerable: true });
};

_applicationMap.registerService = (serviceName, service) => {
    if(_app.service[serviceName]) throw(new Error('Service', serviceName, 'already registered!'));
    Object.defineProperty(_app.service, serviceName, { value:service, writable: false, enumerable: true });
};

_applicationMap.registerEvent = (eventsName, event) => {
    if(_app.events[eventsName]) throw(new Error('Event', eventsName, 'already registered!'));
    Object.defineProperty(_app.events, eventsName, { value:event, writable: false, enumerable: true });
};

_applicationMap.registerEventsByObject = eventsObject => {
    Object.keys(eventsObject).forEach(key => {
        if(_app.events[key]) throw(new Error('Event with key', key,'already registered!'));
        Object.defineProperty(_app.events, key, { value:eventsObject[key], writable: false, enumerable: true });
    });
};

_applicationMap.addComponentMixin = mixin => {
    _componentMixins[_componentMixins.length] = mixin;
};

_applicationMap.cloneAppObject = () => {
    return Object.create(_app);
};




// middleware configs

Object.defineProperties(_applicationMap, {
    'configs': { get: () => _configs },
    doBeforeMethods: { get: () => _doBefore },
    doAfterMethods: { get: () => _doAfter },
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

_applicationMap.on = (event, isLoggable) => {
    isLoggable = isLoggable !== false;
    
    let scope = Scope(true);

    // now add listeners to events from application configs
    emitter.on(event).to( (event, params) => {
        let doBefore = _doBefore || Scope(true);
        let doAfter = _doAfter || Scope(true);

        params = params || {};

        isLoggable && console.log("!! -> ", event, '--> Starting middleware configs');

        // TODO - move this somewhere
        let data = {event, params, locals: {data: {}}};
        data.calls = {lastCall: null};
        data.debug = DebugObject(data);
        data.isLoggable = isLoggable;
        data.localStorage = {};

        let app = _applicationMap.cloneAppObject();

        doBefore.run(data, app,
            (data, app) => scope.run(data, app,
                (data, app) => doAfter.run(data, app)));
    });

    return ChoiceBlock(scope);
};


_applicationMap.mapView = viewClass => {
    let _chain = {};

    _chain.toViewModel = viewModelClass => {
        if (_modelMap.get(viewClass)){
            throw(new Error(modelClass.name +' already mapped to '+ viewClass.name +'!'));
        }

        _modelMap.set(viewClass, viewModelClass);
        return _chain;
    };

    return _chain;
};

_applicationMap.getViewModelByView = viewClass => {
    return _modelMap.get(viewClass);
};

_applicationMap.enableLogging = () => {
    _loggingIsEnabled = true;
};

_applicationMap.disableLogging = () => {
    _loggingIsEnabled = false;
};

let DebugObject = (data) => {
    let _DebugObject = {};

    _DebugObject.stack =[];
    _DebugObject.depth = 0;

    _DebugObject.addToStack = (methodName, guardResult) => {
        let stack = data.debug.stack;
        stack[stack.length] = {
            text:methodName,
            depth:data.debug.depth,
            guardResult:guardResult || null
        }
    };

    _DebugObject.logStack = () => {
        let stack = data.debug.stack;
        let logString = '';
        stack.forEach(stackInfo => {
            let isGuard = stackInfo.guardResult !== null;
            let displayedDepth = isGuard ? stackInfo.depth : stackInfo.depth;
            let str = stackInfo.text;
            let indent = new Array(displayedDepth * 4 + 1).join(' ');

            if(isGuard) str = 'if(' + str +')   ('+stackInfo.guardResult+')';

            str = indent + str;

            logString += str + '\n';
        });
        console.log(logString);
    };

    return _DebugObject;
};

module.exports = _applicationMap;