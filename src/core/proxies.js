'use strict';

let _                   = require('lodash');
let HashMap             = require('../HashMap');
let _proxyMap           = HashMap();
let _interfacesByName   = Object.create(null);

let CallbackMultiSwitch = callback => {
    let _numCallbacks = 0;
    let _numCallbacksCalled = 0;
    return {
        addCallback: () => {
            let _called = false;
            _numCallbacks++;
            return () => {
                if(_called)
                    throw new Error('A callback supplied to CallbackMultiSwitch must not be called more thatn once!');

                _numCallbacksCalled++;
                _numCallbacks === _numCallbacksCalled && callback();
            }
        }
    }
};


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


    _Proxy.findByProps = (conditions) => {
        if (_.isNil(conditions)) throw new Error('conditions must be supplied!');
        let collection = [];
        let conditionKeys = Object.keys(conditions);

        let instanceProps, holder, conditionKey, i, ii;

        for (i = instances.length - 1; i >= 0; i--) {
            holder        = instances[i];
            instanceProps = Object.assign({}, holder.props, holder.state);

            for(ii = conditionKeys.length = 1; ii >= 0; ii--) {
                conditionKey = conditionKeys[ii];
                if(instanceProps[conditionKey] === conditions[conditionKey]) {
                    collection[collection.length] = holder;
                }
            }
        }

        return collection;
    };

    let warnIfUpdatePropsAreNotDefined = (holder, updateKeys) => {
        let propTypes = holder._reactComponent.constructor.propTypes;
        if(!propTypes)
            return console.warn(`Updating props for ${holder._reactComponent.constructor.name}, but none defined.`);

        for(let i = updateKeys.length - 1; i >= 0; i--){
            if(_.isUndefined(propTypes[updateKeys[i]])){
                console.warn(`Updating prop '${updateKeys[i]}' on ${holder._reactComponent.constructor.name}, `
                + `but it is not defined in static 'propTypes'.`);
            }
        }
    };

    let query = (isUpdate, conditions, isState=false, update=undefined, callback=undefined) => {
        if (_.isNil(conditions)) throw new Error('conditions must be supplied!');
        if (isUpdate && _.isNil(update)) throw new Error('update object must be supplied when updating!');

        let collection = [];
        let conditionKeys = Object.keys(conditions);
        let updateKeys = Object.keys(update);

        let queryObject, updateObject, holder, conditionKey, updateKey, i, ii;

        let callbackSwitch = callback ? CallbackMultiSwitch(callback) : undefined;

        for (i = instances.length - 1; i >= 0; i--) {
            holder        = instances[i];

            // TODO - does to every instance currently. First may be enough? Depends on interfaces
            warnIfUpdatePropsAreNotDefined(holder, updateKeys);

            queryObject = isState ? holder.state || {} : Object.assign({}, holder.props, holder.state);
            updateObject = Object.assign({}, holder.props, holder.state);

            for(ii = conditionKeys.length - 1; ii >= 0; ii--) {
                conditionKey = conditionKeys[ii];

                if(queryObject[conditionKey] === conditions[conditionKey]) {
                    for(let iii = updateKeys.length - 1; iii >= 0; iii--){
                        updateKey = updateKeys[iii];
                        if(isUpdate) updateObject[updateKey] = update[updateKey];
                    }
                    if(!isUpdate) collection[collection.length] = holder;
                }
            }

            if(!isUpdate) continue;

            // now update the holder with the newly created props
            if(callbackSwitch){
                holder.setProps(updateObject, callbackSwitch.addCallback());
            } else {
                holder.setProps(updateObject);
            }
        }

        if(!isUpdate) return collection;
    };


    _Proxy.findByProps = conditions => {
        return query(false, conditions);
    };

    _Proxy.findbyState = conditions => {
        return query(false, conditions, true);
    };

    _Proxy.updateByProps = (conditions, update, callback) => {
        return query(true, conditions, false, update, callback);
    };

    _Proxy.updateByState = (conditions, update, callback) => {
        return query(true, conditions, true, update, callback);
    };



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
