'use strict';

let HashMap         = require('../HashMap');
let emitter         = require("../globalEmitter");
let assetManager    = require("../assetManager");
let globalEmitter   = require('../globalEmitter');
let ChoiceBlock     = require('./core').ChoiceBlock;
let Scope           = require('./core').Scope;
let _               = require('lodash');


let _applicationMap         = {};

let _configs                = [];

let _proxyMap                 = HashMap();

let _doBefore               = null;
let _doAfter                = null;
let _componentMixins        = [];
let _loggingIsEnabled       = false;

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

let threadId = 0;
let mapEventAndReturnChoice = (events, isLoggable=true, isOnce=false) => {
    let scope = Scope();
    let doBefore = _doBefore || Scope();
    let doAfter = _doAfter || Scope();

    // now add listeners to events from application configs
    events.forEach(event => emitter.on(event).to( (event, params) => {
        params = params || {};

        let thread = threadId++;

        isLoggable && console.log('|' + _.pad(thread, 10) + "|--------------> Event emited: " + event);

        let data = DataObject(params, event, isLoggable, thread);
        let app = _app;

        doBefore.run(data, app,
            (data, app) => scope.run(data, app,
                (data, app) => doAfter.run(data, app, () => {
                    isLoggable && console.log('|' + _.pad(thread, 10) + '|<-------------- COMPLETE');
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
    return mapEventAndReturnChoice(events);
};


_applicationMap.enableLogging = () => {
    _loggingIsEnabled = true;
};

_applicationMap.disableLogging = () => {
    _loggingIsEnabled = false;
};

let DataObject = (params=undefined, event=undefined, isLoggable=false, threadId) => {
    let data = {event, params, threadId, locals: {data: {}}};
    data.calls = {lastCall: null};
    data.debug = DebugObject(data);
    data.debug.isLoggable = isLoggable;
    data.localStorage = {};

    return data;
}

let DebugObject = data => {
    let _DebugObject = {};

    _DebugObject.stack =[];
    _DebugObject.depth = 0;
    _DebugObject.isLoggable = false;

    let _currentDebugString = null;

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

    _DebugObject.log = (...args) => {
        let threadId    = data.threadId + '';
        let event       = data.event;
        let depth       = data.debug.depth;
        let debug       = data.debug.debugString;

        const EVT_LENGTH = 30;
        let eventStr = _.pad(event, EVT_LENGTH);
        if(eventStr.length > EVT_LENGTH) eventStr = eventStr.substr(0, EVT_LENGTH-3) + '...';
        let startingText = '|'+_.pad(threadId, 10) + '|' + eventStr + '|';
        args.unshift(_.padEnd(startingText, (depth + 1) * 4 + startingText.length));
        console.log.apply(null, args);
    }

    Object.defineProperties(_DebugObject, {
        debugString: {
            get: () => {
                let str = _currentDebugString;
                _currentDebugString = null;
                return str;
            },
            set: string => _currentDebugString = string
        }
    });

    return _DebugObject;
};






/******************************************************************************
 * Proxies and instances
 **************************************************************************/

let Proxy = iFace => {

    let _Proxy = Object.create(null);

    let instances = [];

    // warning - use at your own peral!
    Object.defineProperty(_Proxy, 'instances', {
        value: instances,
        enumerable: true,
        writable: false
    });

    // add all the methods of the interface to the proxy and make
    // them call the same method on each instance.
    iFace.methodNames.forEach(name => Object.defineProperty(_Proxy, name, {
        value:(...args) => {
            for(let instance, i = 0, l = instances.length; i < l; i++) {
                instance = instances[i];
                instance[name].apply(instance, args);
            }
        },
        writable: false,
        enumerable : true,
        configurable :false
    }));

    _Proxy.addInstance = instance => {
        for(let i = instances.length - 1; i >= 0; i--) {
            if(instances[i] === instance)
                throw(new Error('Instance already in proxy!'));
        }
        instances[instances.length] = instance;
    }

    _Proxy.removeInstance = instance => {
        for(let i = instances.length - 1; i >= 0; i--){
            if(instances[i] === instance){
                return instances.splice(i, 1);
            }

            if(i === 0)
                throw(new Error('Instance of ' + instance.constructor + ' not found in proxy!'));
        }
    }

    return _Proxy;
};

_applicationMap.registerInterface = iFace => {
    if(_proxyMap.get(iFace)) return; // already registered

    _proxyMap.set(iFace, Proxy(iFace));

}

_applicationMap.registerInstance = (instance, interfaces) => {
    interfaces.forEach(iFace => {
        let proxy = _proxyMap.get(iFace);
        if(!proxy) throw(new Error('Interface has not been registered!'));

        proxy.addInstance(instance);
    })
}

_applicationMap.unregisterInstance = (instance, interfaces) => {
    interfaces.forEach(iFace => {
        let proxy = _proxyMap.get(iFace);
        if(!proxy) throw(new Error('Interface has not been registered!'));

        proxy.removeInstance(instance);
    })
}


_applicationMap.getProxyByInterface = iFace => {
    if(_.isNil(iFace)) throw(new Error('Interface must be supplied!'));
    let proxy = _proxyMap.get(iFace);

    if(!proxy) throw(new Error('Interface not registered!'));

    return proxy;
}






let _app                    = {};

Object.defineProperties(_app, {
    model: {  value: _model, writable: false,  enumerable: true },
    service: { value: {}, writable: false, enumerable: true },
    events: { value: {}, writable: false, enumerable: true },
    emitter: { value: emitter, writable: false, enumerable: true },
    assetManager: { writable: false, enumerable: true, value: assetManager },
    map: { value: this, writable: false, enumerable: true },
    getProxyByInterface: { writable: false, enumerable: true, value: _applicationMap.getProxyByInterface }
});



module.exports = _applicationMap;