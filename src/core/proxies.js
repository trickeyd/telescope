'use strict';

let _                   = require('lodash');
let HashMap             = require('../HashMap')
let _proxyMap           = HashMap();
let _interfacesByName   = Object.create(null);

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

let Interface = (name, methodNames) => {
    if(!_.isString(name))
        throw(new Error('Interface key must be a string!'));

    if(!_.isArray(methodNames))
        throw(new Error('Second argument of Interface must be an array of method names!'))

    return { name, methodNames }
};


module.exports = {
    registerInstance: (instance, interfaces) => {
        interfaces.forEach(iFace => {
            let proxy = _proxyMap.get(iFace);
            if (!proxy) throw(new Error('Interface has not been registered!'));

            proxy.addInstance(instance);
        })
    },

    unregisterInstance: (instance, interfaces) => {
        interfaces.forEach(iFace => {
            let proxy = _proxyMap.get(iFace);
            if (!proxy) throw(new Error('Interface has not been registered!'));

            proxy.removeInstance(instance);
        })
    },

    getProxyByInterface: iFace => {
        if (_.isNil(iFace)) throw(new Error('Interface must be supplied!'));
        let proxy = _proxyMap.get(iFace);

        if (!proxy) throw(new Error('Interface not registered!'));

        return proxy;
    },

    getInstanceByInterface: iFace => {
        if (_.isNil(iFace)) throw(new Error('Interface must be supplied!'));

        let proxy = _proxyMap.get(iFace);
        if (!proxy) throw(new Error('Interface not registered!'));

        let intances = proxy.instances;
        if(intances.length > 1)
            throw(new Error('Method "getInstanceByInterface" can only be used for single instance components. There' +
                'are currently ' + instances.length + ' instances of ' + iFace.name + '!'));

        return intances[0];
    },

    registerInterfaces: interfaces => {
        //let interfaces = callback(Interface);
        let ret = {};
        Object.keys(interfaces).forEach(key => {
            if(_interfacesByName[key])
                throw(new Error('An intercafe has already been registered with the name "'+key+'"'));

            let methods = interfaces[key];

            let iFace = ret[key] = _interfacesByName[key] = Interface(key, methods);

            if (_proxyMap.get(iFace)) return; // already registered
            _proxyMap.set(iFace, Proxy(iFace));
        })

        return ret;
    }
}
