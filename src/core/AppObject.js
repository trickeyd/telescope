'use strict';

let assetManager    = require("../assetManager");
let emitter         = require("../globalEmitter");
let proxies         = require("./proxies");

let AppObject = (model, service, events) => {
    let _App = {};

    Object.defineProperties(_App, {
        model: {  value: model, writable: false,  enumerable: true },
        service: { value: service, writable: false, enumerable: true },
        events: { value: events, writable: false, enumerable: true },
        emitter: { value: emitter, writable: false, enumerable: true },
        assetManager: { writable: false, enumerable: true, value: assetManager },
        getProxyByType: { writable: false, enumerable: true, value: proxies.getProxyByType },
        getInstanceByType: { writable: false, enumerable: true, value: proxies.getInstanceByType },
    });

    Object.freeze(_App);

    return _App
}

module.exports = AppObject;