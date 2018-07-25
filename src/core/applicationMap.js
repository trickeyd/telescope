'use strict';

let HashMap         = require('../HashMap');
let emitter         = require("../globalEmitter");
let assetManager    = require("../assetManager");
let ChoiceBlock     = require('./core').ChoiceBlock;
let Scope           = require('./core').Scope;
let _               = require('lodash');


let _applicationMap = {};

let _app                = {};
let _configs            = [];
let _modelMap           = HashMap();

let _implementations    = HashMap();
let _proxyInstances     = HashMap();
let _proxyMap           = Object.create(null);
let _keyMap             = Object.create(null);

let _doBefore           = null;
let _doAfter            = null;
let _componentMixins    = [];
let _loggingIsEnabled   = false;

let _model = {
    clear: () => Object.keys(_model).forEach( key => _.isFunction(_model[key]['clear']) && _model[key].clear())
};

// app object definitions

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

let Proxy = (methodNames, instances) => {

    let _Proxy = Object.create(null);

    // warning - use at your own peral!
    Object.defineProperty(_Proxy, 'instances', {
        value: instances,
        enumerable: true,
        writable: false
    });

    methodNames.forEach(name => Object.defineProperty(_Proxy, name, {
        value:(...args) => {
            let instance;
            for(let i = 0, l = instances.length; i < l; i++) {
                instance = instances[i];
                instance[name].apply(instance, args);
            }
        },
        writable: false,
        enumerable : true,
        configurable :false
    }));

    return _Proxy;
};

let Interface = (methodNames, components) => {
    if(!_.isArray(methodNames))
        throw(new Error('The first argument of Interface must be an array of method names!'))

    if(!_.isArray(components))
        throw(new Error('The second argument of Interface must be an array of view components that implement it!'))

    return { methodNames, components }
}


_applicationMap.registerInterfaces = callback => {
    let configs = callback(Interface);

    Object.keys(configs).forEach(configKey => {

        if(_keyMap[configKey])
            throw(new Error('Interface for key ', configKey + ' has already been registerd!'));

        Object.defineProperty(_keyMap, configKey, {
            value:configKey,
            enumerable:true,
            writable:false
        });

        let _interface = configs[configKey];

        let instances = [];
        let proxy = Proxy(_interface.methodNames, instances);

        _proxyInstances.set(proxy, instances);

        // proxy mapped to the key so user can access from frontware
        _proxyMap[configKey] = proxy;

        // map component to its (multiple) proxies
        _interface.components.forEach(component => {
            let proxies = _implementations.get(component);
            if(!proxies) _implementations.set(component, proxies = []);
            proxies.push(proxy);
        });
    });
}

_applicationMap.registerInstance = instance => {
    let proxyInstances;
    let proxies = _implementations.get(instance.constructor);

    if(_.isNil(proxies)) return;

    for(let i = proxies.length - 1; i >= 0; i--){
        proxyInstances = _proxyInstances.get(proxies[i]);
        proxyInstances[proxyInstances.length] = instance;
    }
}
_applicationMap.unregisterInstance = instance => {
    let proxyInstances, i, ii;
    let proxies = _implementations.get(instance.constructor);

    if(_.isNil(proxies)) return;

    for(i = proxies.length - 1; i >= 0; i--){
        proxyInstances = _proxyInstances.get(proxies[i]);
        for(ii = proxyInstances.length - 1; ii >= 0; i--){
            // For speed this does not maintain order. Problem?
            if(proxyInstances[ii] === instance){
                proxyInstances[ii] = proxyInstances[proxyInstances.length - 1];
                proxyInstances.pop();
                return;
            }
        }
    }
};

_applicationMap.getProxyByInterfaceKey = callback => {
    let key = callback(_keyMap);

    if(!_.isString(key)) throw(new Error('Key must be supplied, not ' + typeof key));

    let proxy = _proxyMap[key];

    if(!proxy) throw(new Error('No interface fegistered to key ' + key + '!'));

    return proxy;
}


Object.defineProperties(_app, {
    model: {  value: _model, writable: false,  enumerable: true },
    service: { value: {}, writable: false, enumerable: true },
    events: { value: {}, writable: false, enumerable: true },
    emitter: { value: emitter, writable: false, enumerable: true },
    assetManager: { writable: false, enumerable: true, value: assetManager },
    map: { value: this, writable: false, enumerable: true },
    getProxyByInterfaceKey: { writable: false, enumerable: true, value: _applicationMap.getProxyByInterfaceKey }
});

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


let mapEventAndReturnChoice = (events, isLoggable=true, isOnce=false) => {
    let scope = Scope(true);

    // now add listeners to events from application configs
    events.forEach(event => emitter.on(event).to( (event, params) => {
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
    return mapEventAndReturnChoice(events);
};


_applicationMap.mapView = viewClass => {
    let _chain = {};

    // check if is a component

    _chain.toViewModel = viewModelClass => {
        if (_modelMap.get(viewClass))
            throw(new Error('Model ' + modelClass.name +' already mapped to '+ viewClass.name +'!'));

        _modelMap.set(viewClass, viewModelClass);
        return _chain;
    };

/*    _chain.toFrontware = (frontware) => {
        if(!_.isFunction(frontware))
            throw(new Error('frontware and components must be defined!'));
        if(!frontware.length !== 3)
            throw(new Error('frontware functions must accept 3 arguments: (data, app, componentProxy)!'));
        if(!_.isNil(_app.frontware.get(viewClass)))
            throw(new Error('Component class: ' + viewClass.name + ' already registered to frontware!'));

        _frontwareMap.set(viewClass, frontware);
    };*/

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