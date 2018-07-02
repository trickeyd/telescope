'use strict';
import emitter from './src/globalEmitter';
import ComponentAccess from './src/ComponentAccess';
import assetManager from './src/assetManager';
import map from './src/applicationMap';
import middlewareRunner from './src/middlewareRunner';
import lastCallWasSuccess from './src/guards/lastCallWasSuccess';
import fetchJson from './src/middleware/fetchJson';
import dispatchEvent from './src/middleware/dispatchEvent';

let start  = (...configs) => {
    // this is to avoid hot reloading going through everything again
    if(global.replanInitCalled) return;

    global.replanInitCalled = true;

    // run the config methods
    configs.forEach(config => config());

    // now add listeners to events from application configs
    map.configs.forEach(config => {
        emitter.on(config.event).to(
            (event, params) => middlewareRunner(
                event, params, config.sequence.concat(), config.isLoggable && map.loggingIsEnabled
            )
        );
    });
};

let guards = {
    lastCallWasSuccess
};

let middleware = {
    fetchJson,
    dispatchEvent
};

export { start, assetManager, emitter, map, ComponentAccess, guards, middleware };