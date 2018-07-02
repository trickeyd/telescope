'use strict';

import HashMap from './HashMap';
import emitter from "./globalEmitter";
import assetManager from "./assetManager";
import _ from 'lodash';


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
    map: { value: this, writable: false, enumerable: true },
    loggingIsEnabled: { get: () => _loggingIsEnabled }
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
    componentMixins: { get: () => _componentMixins }
});

_applicationMap.doBefore = (...middleware) => {
    _doBefore = _doBefore.concat(createFlatArray(middleware));
};

_applicationMap.doAfter = (...middleware) => {
    _doAfter = _doAfter.concat(createFlatArray(middleware));
};

_applicationMap.on = (event, isLoggable) => {
    let sequence = [];
    let step;
    let ifStep;
    isLoggable = isLoggable === false ? false : true;

    /**
     * creates new step in sequence
     * @returns {{do: _do, if: _newIf}}
     * @private
     */
    let _then = () => {
        ifStep = undefined;
        step = sequence[sequence.length] = Object.create(null);
        return { 'do':_do, 'if':_newIf }
    };


    /**
     * /**
     * Adds an array of middleware methods to the current step
     * @param middlewares
     * @returns {{then}}
     * @private
     */
    let _do = (...middlewares) => {
        step.exec = createFlatArray(middlewares);
        return { get then() { return _then() }}
    };



    /**
     * Adds an array of middleware methods to the current ifStep
     * @param middlewares
     * @returns {{else: _else, then: _then}}
     * @private
     */
    let _ifDo = (...middlewares) => {
        ifStep.exec = createFlatArray(middlewares);
        return {
            get else() { return _else(); },
            get then() { return _then(); }
        }
    };



    /**
     * Sets the 'stop' property on the ifStep object to true
     * and calls _ifDo with payload.
     * @param middlewares
     * @returns {{else, then}|{else: _else, then: _then}}
     * @private
     */
    let _ifDoAndStop = (...middlewares) => {
        ifStep.stop = true;
        return _ifDo(middlewares);
    };


    /**
     * Creates a new ifStep and adds it to the current step
     * then calls and returns _if method
     * @param guards
     * @returns {{do}}
     * @private
     */
    let _newIf = (...guards) => {
        ifStep = {};
        step.if = [ifStep];
        return _if(guards);
    };



    /**
     * adds new ifStep to current step.if array
     * creates a 'guards' array containing a nullGuard
     * @returns {{do: _do, if: _if}}
     * @private
     */
    let _else = () => {
        ifStep = {};
        step.if.push(ifStep);
        ifStep.guards = [nullGuard];
        return { 'do' : _do, 'if' : _if }
    };



    /**
     * creates a flat array of guards and adds them to the current ifStep
     * Replaces [nullGuard] if previously defined by _else
     * @param guards
     * @returns {{do: _ifDo, doAndStop: _ifDoAndStop}}
     * @private
     */
    let _if = (...guards) => {
        ifStep.guards = createFlatArray(guards);
        return { 'do':_ifDo, 'doAndStop':_ifDoAndStop }
    };


    _configs[_configs.length] = { event, sequence, isLoggable };

    return {
        get do() { return _then().do },
        get if() { return _then().if }
    }

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