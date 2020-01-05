import { Scope } from "./src/core/core";
import proxies from "./src/core/proxies";
import emitter from './src/globalEmitter';
import assetManager from './src/assetManager';
import map from './src/core/applicationMap';
import lastCallWasSuccess from './src/guards/lastCallWasSuccess';
import fetchJson from './src/middleware/fetchJson';
import dispatchEvent from './src/middleware/dispatchEvent';
import interfaceEqualTo from './src/middleware/interfaceEqualTo';
import replanEvents from './src/core/replanEvents';

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

export default {
    get start() { return start; },
    get assetManager() { return assetManager; },
    get emitter() { return emitter; },
    get map() { return map; },
    get guards() { return guards; },
    get middleware() { return middleware; },
    get proxies() { return proxies; },
    get Scope() { return Scope; },
    get replanEvents() { return replanEvents; },
};
