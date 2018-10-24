'use strict';

let _                   = require('lodash');
let HashMap             = require('../HashMap');
let _proxyMap           = HashMap();
let _interfacesByName   = Object.create(null);

let Proxy = iFace => {

    let _Proxy = Object.create(null);

    let instances = [];

    // warning - use at your own peril!
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

    _Proxy.setProps = (props, callback) => {
        instances.forEach(inst => inst.setProps(props, callback));
    };

    _Proxy.setState = (state, callback) => {
        instances.forEach(inst => inst.setState(state, callback));
    };

    _Proxy.addInstance = instance => {
        for(let i = instances.length - 1; i >= 0; i--) {
            if(instances[i] === instance)
                throw(new Error('Instance already in proxy!'));
        }
        instances[instances.length] = instance;
    };

    _Proxy.removeInstance = instance => {
        for(let i = instances.length - 1; i >= 0; i--){
            if(instances[i] === instance){
                return instances.splice(i, 1);
            }

            if(i === 0)
                throw(new Error('Instance of ' + instance.constructor + ' not found in proxy!'));
        }
    };

    return _Proxy;
};

let Interface = (name, methodNames) => {
    if(!_.isString(name))
        throw(new Error('Interface key must be a string!'));

    if(!_.isArray(methodNames))
        throw(new Error('Second argument of Interface must be an array of method names!'));

    return { name, methodNames }
};


module.exports = {
    registerInstance: (instance) => {
        _proxyMap.get(instance.constructor).addInstance(instance);

        let interfaces = instance.constructor.interfaces;
        interfaces.forEach(iFace => {
            let proxy = _proxyMap.get(iFace);
            if (!proxy) throw(new Error('Interface has not been registered!'));

            proxy.addInstance(instance);
        })
    },

    unregisterInstance: (instance) => {
        _proxyMap.get(instance.constructor).removeInstance(instance);

        let interfaces = instance.constructor.interfaces;
        interfaces.forEach(iFace => {
            let proxy = _proxyMap.get(iFace);
            if (!proxy) throw(new Error('Interface has not been registered!'));

            proxy.removeInstance(instance);
        })
    },

    /**
     * @function getMethodByType - accepts an interface of a constructor
     * @param type
     * @returns {Proxy}
     */
    getProxyByType: type => {
        if (_.isNil(type)) throw(new Error('Interface must be supplied!'));
        let proxy = _proxyMap.get(type);

        if (!proxy) throw(new Error('Interface not registered!'));

        return proxy;
    },

    /**
     * @function getInstanceByType - accepts an interface of a constructor
     * @param type
     * @returns {Proxy}
     */
    getInstanceByType: type => {
        if (_.isNil(type)) throw(new Error('Interface must be supplied!'));

        let proxy = _proxyMap.get(type);
        if (!proxy) throw(new Error('Interface not registered!'));

        let instances = proxy.instances;
        if(instances.length > 1)
            throw(new Error('Method "getInstanceByType" can only be used for single instance components. There' +
                'are currently ' + instances.length + ' instances of ' + type.name + '!'));

        return instances[0];
    },

    registerInterfaces: interfaces => {
        let ret = {};
        Object.keys(interfaces).forEach(key => {
            if(_interfacesByName[key])
                throw(new Error('An interface has already been registered with the name "'+key+'"'));

            let methods = interfaces[key];

            let iFace = ret[key] = _interfacesByName[key] = Interface(key, methods);

            if (_proxyMap.get(iFace)) return; // already registered
            _proxyMap.set(iFace, Proxy(iFace));
        });

        return ret;
    },

    registerType: (holder, name) => {
        if (_proxyMap.get(holder)) return; // already registered
        _proxyMap.set(holder, Proxy(Interface(name, [])));
    }
};
