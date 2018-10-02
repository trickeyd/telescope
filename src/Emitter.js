'use strict';

module.exports = function Emitter() {
    let _Emitter = {};

    let _mapListenersByType = Object.create(null);

    /**
     * @function on
     * @param {String} event -  name of event being mapped.
     * @return {Object} to chain object.
     */
    _Emitter.on = event => {
        if(arguments.length > 1){
            throw(new Error('EventDispatcher.on requires one argument. Use on().to() to add listener!'));
        }
        let _chain = {};
        let mapObjects = _mapListenersByType[event];
        let mapObject = {event : event, listener:null, isOnce : false};

        if(!mapObjects) {
            mapObjects  = _mapListenersByType[event] = [];
        }

        /**
         * @function to
         * @param {Function} listener - method to be called when event is emitted.
         * @return {Object} chained methods.
         */
        _chain.call = _chain.to = listener => {
            if (!listener || typeof listener !== 'function') {
                throw(new Error("Non-function is being added as a handler"));
            }
            if(_Emitter.mappingExists(event, listener)){
                throw(new Error("Mapping for "+ event +" already exists with this listener!"));
            }
            mapObject.listener = listener;
            mapObject.event = event;
            mapObjects.push(mapObject);
            return _chain;
        };

        /**
         * contains remaining config options. (if more are added, must return again from each method)
         * @function once
         * @return {Object} chained methods.
         */
        _chain.once = (isOnce=true) => {
            mapObject.isOnce = isOnce;
            return _chain;
        };

        return _chain;
    };


    /**
     * @function unmap
     * @param {String} event Name of event being unmapped.
     * @return {Object} chained methods.
     */
    _Emitter.unmap = event => {
        let _chain = {};
        let mapObjects = _mapListenersByType[event];

        /**
         * @function from
         * @param {Function} listener - method to be unmapped.
         * */
        _chain.from = function (listener) {
            if (mapObjects) {
                for (let i = mapObjects.length - 1; i >= 0; i--) {
                    let mapObject = mapObjects[i];
                    if (mapObject.listener === listener) {
                        mapObjects.splice(i, 1);
                        return;
                    }
                }
                throw(new Error("Unmapping listener that is not mapped to "+event+"!"));
            }
        };

        return _chain;
    };


    /**
     * Unmaps all event.
     * @function unmapAll
     */
    _Emitter.unmapAll = () => {
        _mapListenersByType = Object.create(null);
    };


    /**
     * @function mappingExists
     * @param {String} event Name of event being checked.
     * @param {Function} listener Listener being checked.
     * @return {Boolean} returns whether or not mapping exists.
     */
    _Emitter.mappingExists = (event, listener) => {
        let mapObjects = _mapListenersByType[event];
        if(!mapObjects) {
            return false;
        }
        for (let i = mapObjects.length - 1; i >= 0; i--) {
            if (mapObjects[i].listener === listener) {
                return true;
            }
        }
        return false;
    };

    /**
     * @function emit.
     * @param {String} event Event identifier string.
     * @param {Object} payload to be passed to method.
     */
    _Emitter.emit = (event, payload) => {
        if(!event) throw(new Error("event is undefined"));
        let listenerConfigs = _mapListenersByType[event];
        if(listenerConfigs) {
            for (let i = 0, l = listenerConfigs.length, config; i < l; i++) {
                config = listenerConfigs[i];
                config.isOnce && _Emitter.unmap(event).from(config.listener);
                config.listener(payload, event);
            }
        }
    };

    return _Emitter;
};
