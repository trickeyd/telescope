

let _doBefore               = null;
let _doAfter                = null;
let _componentMixins        = [];
let _loggingIsEnabled       = false;
let _service                = {};
let _events                 = {};
let _model                  = { 
                                  clear: () => Object.keys(_model).forEach( key => {
                                      _.isFunction(_model[key]['clear']) && _model[key].clear();
                                  }),
                                  clearForResync: () => Object.keys(_model).forEach( key => {
                                      _.isFunction(_model[key]['clearForResync']) && _model[key].clearForResync();
                                  })
                              };

// app object definitions
export const registerModel = (modelName, model) => {
    if(_model[modelName]) throw(new Error('Model', modelName, 'already registered!'));
    Object.defineProperty(_model, modelName, { value:model, writable: false, enumerable: true });
};

export const registerService = (serviceName, service) => {
    if(_service[serviceName]) throw(new Error('Service', serviceName, 'already registered!'));
    Object.defineProperty(_service, serviceName, { value:service, writable: false, enumerable: true });
};

export const registerEvent = (eventsName, event) => {
    if(_events[eventsName]) throw(new Error('Event', eventsName, 'already registered!'));
    Object.defineProperty(_events, eventsName, { value:event, writable: false, enumerable: true });
};

export const registerEventsByObject = eventsObject => {
    Object.keys(eventsObject).forEach(key => {
        if(_events[key]) throw(new Error('Event with key', key,'already registered!'));
        Object.defineProperty(_events, key, { value:eventsObject[key], writable: false, enumerable: true });
    });
};

export const addComponentMixin = mixin => {
    _componentMixins[_componentMixins.length] = mixin;
};

export const doBefore = scope => {
    if(_doBefore)
        throw new Error('Do before scope has already been set!');
    _doBefore = Scope();
    return scope(ChoiceWrapper(_doBefore));
};

export const doAfter = scope => {
    if(_doAfter)
        throw new Error('Do before scope has already been set!');
    _doAfter = Scope();
    return scope(ChoiceWrapper(_doAfter));
};

let _queue = [];

export const on = (events, scope, isLoggable=true, isOnce=false, skipBefore=false, skipAfter=false) => {
    if(_.isString(events)) events = [events];
    if(!_.isArray(events)) throw new Error('"events" must be a string, or an array of strings!');

    if(!_.isFunction(scope) || scope.length !== 1)
        throw(new Error('"scope" must be a method accepting a single argument!'));

    events.forEach(event => {
        if(!_.isString(event))
            throw new Error(`"events" arrays must contain only strings, not ${typeof event}!`);
    });

    // TODO - refactor the before / after stuff as is a bit whack at the moment
    let doBefore = skipBefore === true || _.isNil(_doBefore) ? Scope() : _doBefore;
    let doAfter  = skipAfter  === true || _.isNil(_doAfter)  ? Scope() : _doAfter;

    let runMethod = (params, event) => {
        params = params || {};

        let data = DataObject(params, event, isLoggable);
        let app = AppObject(_model, _service, _events);

        let parentScope = Scope();
        parentScope.INTERNAL_setEventType(event);
        parentScope.INTERNAL_setObjects(data, app);

        isLoggable && data.debug.log("EMITTED  |-------------->  " + event);
        isLoggable && data.debug.log("with params  |---------->  ", params);

        // TODO - I could cash the scopes so it doesn't need to
        // add children etc every time
        let newScope = Scope();

        parentScope.addChild(doBefore);
        parentScope.addChild(newScope);
        parentScope.addChild(doAfter);

        scope(ChoiceWrapper(newScope));

        // TODO - can prob stop passing these obs into run now (apart from callback)
        parentScope.run(data, app, (data, app) => {
            isLoggable && data.debug.log('COMPLETE |<--------------  ' + event);
        });

    };

/*    let sortQueue = runMethod => (params, event) => {
        let method = () => runMethod(params, event);

        _queue[_queue.length] = method;

        if(_queue.length === 1){
            method();
        }

    };*/

    // now add listeners to events from application configs
    events.forEach(event => emitter.on(event).to(/*sortQueue(*/runMethod/*)*/).once(isOnce));

    return scope;
};


export const enableLogging = () => {
    _loggingIsEnabled = true;
};

export const disableLogging = () => {
    _loggingIsEnabled = false;
};

export default {
  on,
  doBefore,
  doAfter,
  registerEventsByObject,
  addComponentMixin,
  registerService,
  registerEvent,
  registerModel,
  enableLogging,
  disableLogging,
  get componentMixins() { return  _componentMixins }, 
  get loggingIsEnabled() { return  _loggingIsEnabled  }
};
