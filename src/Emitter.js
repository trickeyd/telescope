'use strict';
/**
 * The eventBus is the central bus for receiving and sending out events to and from the application.
 * @module eventBus
 */

let HashMap = require('./HashMap');

module.exports = function Emitter() {
    let _Emitter = {};

    let _mapListenersByType = Object.create(null); // String -> Array(configOb)
    let _mapListenersByGroup = HashMap();


    /**
     * Maps a listener method to a specific string type.
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
        let mapObject = {event : event, listener:null, isOnce : false,
            groupIdentifier : null, eventToSend:undefined};
        let _groupIdentifier = undefined;
        let group = null;

        if(!mapObjects) {
            mapObjects  = _mapListenersByType[event] = [];
        }

        /**
         * @function to
         * @param {Function} listener - method to be called when event is dispatched.
         * @return {Object} chained methods.
         */
        _chain.call = _chain.to = function (listener) {
            if (!listener || typeof listener !== 'function') {
                throw(new Error("Non-function is being added as a handler"));
            }
            if(_Emitter.mappingExists(event, listener)){
                throw(new Error("Mapping for "+ event +" already exists with this listener!"));
            }
            mapObject.listener = listener;
            mapObject.event = event;
            mapObjects.push(mapObject);
            group && group.push(mapObject);
            return _chain;
        };


        /**
         * contains remaining config options. (if more are added, must return again from each method)
         * @function once
         * @return {Object} chained methods.
         */
        _chain.once = function () {
            mapObject.isOnce = true;
            return _chain;
        };


        /**
         * @function
         * adds a signature to a mapping, effectively giving it a group for easy cleanup
         * @param {Object} groupIdentifier used to identify a group.
         * @return {Object} chained methods.
         */
        _chain.withGroupIdentifier = function (groupIdentifier) {
            if (typeof groupIdentifier !== 'object' && typeof groupIdentifier !== "string") {
                throw(new Error("GroupIdentifier must be either an object or a string"));
            }

            if(_groupIdentifier){
                throw(new Error('GroupIdentifier already specified!'));
            }

            _groupIdentifier = groupIdentifier;
            group = _mapListenersByGroup.get(groupIdentifier);
            if(!group) {
                group = [];
                _mapListenersByGroup.set(groupIdentifier, group);
            }
            mapObject.listener && group.push(mapObject);
            mapObject.groupIdentifier = groupIdentifier;
            return _chain;
        };


        /**
         * @function send
         * this allows the sending of an event other than the one mapped
         * @return {Object} chained methods.
         */
        _chain.send = function (eventName) {
            mapObject.eventToSend = eventName;
            return _chain;
        };


        return _chain;
    };


    /**
     * Unmaps a listener method from a specific string type.
     * @function unmap
     * @param {String} event Name of event being unmapped.
     * @return {Object} chained methods.
     */
    _Emitter.unmap = event => {
        let _chain = {};
        let mapObjects = _mapListenersByType[event];

        /**
         * @param {Function} listener - method to be unmapped.
         * */
        _chain.from = function (listener) {
            if (mapObjects) {
                for (let i = mapObjects.length - 1; i >= 0; i--) {
                    let mapObject = mapObjects[i];
                    if (mapObject.listener === listener) {
                        _Emitter.removeFromGroup(mapObject);
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
     * Public.
     * Unmaps an entire group of listeners by groupIdentifier.
     * @function unmapGroup
     * @param {Object} groupIdentifier Object or string name of groupIdentifier supplied when mapping.
     */
    _Emitter.unmapByIdentifier = groupIdentifier => {
        let group = _mapListenersByGroup.get(groupIdentifier);
        if(!group) {
            // No group has been mapped for this identifier.
            return;
        }
        for(let i = group.length - 1; i >= 0; i--) {
            let mapping = group[i];
            _Emitter.unmap(mapping.event).from(mapping.listener);
        }
        _mapListenersByGroup.delete(groupIdentifier);
    };


    /**
     * Unmaps all event.
     * @function unmapAll
     */
    _Emitter.unmapAll = () => {
        _mapListenersByType = Object.create(null);
        _mapListenersByGroup = HashMap();
    };


    /**
     * checks if listener has been mapped.
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
     * Private.
     * checks if mapObject has a specific group and removes mapping if there is.
     * @param {Object} mapObject -  object currently being unmapped.
     */
    _Emitter.removeFromGroup = mapObject => {
        if(mapObject.groupIdentifier === null) {
            return;
        }
        let group = _mapListenersByGroup.get(mapObject.groupIdentifier);
        for (let i = group.length - 1; i >= 0; i--) {
            if(group[i] === mapObject) {
                group.splice(i, 1);
                return;
            }
        }
        throw(new Error("GroupIdentifier expected but no mapping found!"));
    };


    /**
     * dispatches event object to all listeners of type.
     * @function dispatch.
     * @param {String} event Event identifier string.
     * @param {*} payload to be passed to method.
     */
    _Emitter.emit = (event, ...payload) => {
        if(!event) throw(new Error("event is undefined"));
        let listenerConfigs = _mapListenersByType[event];
        if(listenerConfigs) {
            let config;
            let toSend;
            for (let i = 0, l = listenerConfigs.length; i < l; i++) {
                config = listenerConfigs[i];
                toSend = payload.concat();
                config.eventToSend ? toSend.unshift(config.eventToSend) : toSend.unshift(event);
                config.isOnce && _Emitter.unmap(event).from(config.listener);

                config.listener.apply(config.scope, toSend);
            }
        }
    };

    return _Emitter;
}
