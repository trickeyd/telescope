'use strict';

let HashMap         = require('../HashMap');
let emitter         = require("../globalEmitter");
let assetManager    = require("../assetManager");
let ChoiceBlock     = require('./Core').ChoiceBlock;
let Scope           = require('./Core').Scope;
let _               = require('lodash');
let {map}           = require("../../index");


let _applicationMap = {};

let _app = {};
let _configs = [];
let _modelMap = HashMap();
let _doBefore = [];
let _doAfter = [];
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
    _doBefore = _doBefore.concat(createFlatArray(middleware));
};

_applicationMap.doAfter = (...middleware) => {
    _doAfter = _doAfter.concat(createFlatArray(middleware));
};

_applicationMap.on = (event, isLoggable) => {
    isLoggable = isLoggable === false ? false : true;
    
    let scope = Scope();

    // now add listeners to events from application configs
    emitter.on(config.event).to( (event, params) => {
        params = params || {};
        isLoggable && console.log("!! -> ", event, '--> Starting middleware configs');
        let data = {event, params, locals: {data: {}}};
        let app = _applicationMap.cloneAppObject();
        let next = () => console.log('finished');

        scope.run(data, app, next);
    });
            //event, params, config.scope, config.isLoggable && map.loggingIsEnabled

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

export default _applicationMap;



/**
 * takes embedded arrays and flattens them
 * @param props {Array} object
 */
function createFlatArray(props) {
    if(!Array.isArray(props)){
        return [props]
    }

    let methods = [];
    props.forEach(prop => {
        if (Array.isArray(prop))
            methods = methods.concat(createFlatArray(prop));
        else if (typeof prop !== 'function')
            throw(new Error('Only functions or arrays of functions can be added as ' +
                'method, but attempted to add ' + JSON.stringify(prop)));
        else
            methods[methods.length] = prop;
    });
    return methods;
}


/**
 * this is the guard used for else (not elseIf)
 * @returns {boolean}
 */
let nullGuard = () => { return true; };