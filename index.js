'use strict';
let emitter             = require('./src/globalEmitter');
let ComponentAccess     = require('./src/ComponentAccess');
let assetManager        = require('./src/assetManager');
let map                 = require('./src/core/applicationMap');
let runScope            = require('./src/core/Core').runScope;
let lastCallWasSuccess  = require('./src/guards/lastCallWasSuccess');
let fetchJson           = require('./src/middleware/fetchJson');
let dispatchEvent       = require('./src/middleware/dispatchEvent');

let start  = (...configs) => {
    // this is to avoid hot reloading going through everything again
    if(global.replanInitCalled) return;

    global.replanInitCalled = true;

    // run the config methods
    configs.forEach(config => config());
};

let guards = {
    lastCallWasSuccess
};

let middleware = {
    fetchJson,
    dispatchEvent
};

module.exports = { start, assetManager, emitter, map, ComponentAccess, guards, middleware };