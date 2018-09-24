'use strict';

let {
    Scope,
    MethodRunner,
    ChoiceBlock
}                       = require("./src/core/core");
let proxies             = require("./src/core/proxies");
let emitter             = require('./src/globalEmitter');
let assetManager        = require('./src/assetManager');
let map                 = require('./src/core/applicationMap');
let lastCallWasSuccess  = require('./src/guards/lastCallWasSuccess');
let fetchJson           = require('./src/middleware/fetchJson');
let dispatchEvent       = require('./src/middleware/dispatchEvent');
let interfaceEqualTo    = require('./src/middleware/interfaceEqualTo');
let replanEvents        = require('./src/core/replanEvents');

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
    dispatchEvent,
    interfaceEqualTo
};

module.exports = {
    get start() { return start },
    get assetManager() { return assetManager },
    get emitter() { return emitter },
    get map() { return map },
    get guards() { return guards },
    get middleware() { return middleware },
    get proxies() { return proxies },
    get Scope() { return Scope },
    get MethodRunner() { return MethodRunner },
    get ChoiceBlock() { return ChoiceBlock },
    get replanEvents() { return replanEvents },
};