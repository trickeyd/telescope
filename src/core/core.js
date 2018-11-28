'use strict';

let Iterator        = require('./Iterator');
let _               = require('lodash');

let log = (data, method, isTrue=undefined) => {
    let debug       = data.debug.debugString;

    data.debug.deleteOverrideMethodName();

    let string;
    switch(data.debug.type){
        case 'scope':
            string = 'Scope => ';
            break;
            case 'scope+method':
            string = 'ScopeMethod => ';
            break;
        case 'method':
            string = 'Method: ';
            break;
        case 'guard':
            string = 'Guard: ';
            break;
        default:
            string = 'eh?' + data.debug.type;
    }

    string += ' ';
    if(_.isString(debug)){
        string += debug;
    } else if(method && _.isString(method.name) && method.name !== '') {
        string += method.name;
    } else {
        string += '"unknown"';
    }

    if(_.isBoolean(isTrue)){
        string += ' === ' + isTrue;
    }

    data.debug.log(string);
    return string;
};

let Scope = (event=undefined) => {
    let _Scope = {};

    let _children = [];
    let _isCompleted = false;
    let _event = event;
    let _parent = null;

    Object.defineProperties(_Scope, {
        parent: { get: () => _parent },
        event: { get: () => _event }
    });

    _Scope.addChild = (child) => {
        if(child.hasOwnProperty('INTERNAL_setParent')){
            child.INTERNAL_setParent(_Scope);
            child.INTERNAL_setEventType(event);
            child.INTERNAL_app  = _Scope.INTERNAL_app;
            child.INTERNAL_data = _Scope.INTERNAL_data;
        }
        _children[_children.length] = child;
    };

    _Scope.setObjects = (data, app) => {
        _Scope.INTERNAL_app = app || null;
        _Scope.INTERNAL_data = data || null;
    };

    _Scope.completeScope = () => _isCompleted = true;
    _Scope.getIsComplete = () => _isCompleted;

    _Scope.INTERNAL_setEventType = event => _event = event;
    _Scope.INTERNAL_setParent = parent => _parent = parent;

    _Scope.run = (data, app, next) => {
        _Scope.INTERNAL_app = app;
        _Scope.INTERNAL_data = data;
        _isCompleted = false;
        let iterator = Iterator(_children);

        let loop = () => {
            if(_isCompleted || !iterator.hasNext())
                if(next) return next(data, app);
                else     return;

            let child = iterator.next();

            child.run(data, app, loop);
        };

        loop();
    };

    return _Scope;
};


let DoWrapper = (parentScope) => (...methods) => {
    let _DoBlock = {};
    let runner = MethodRunner(parentScope).apply(null, methods);

    _DoBlock.run = runner.run;

    parentScope.addChild(_DoBlock);

    return ChoiceWrapper(parentScope);
};


let IfWrapper = (parentScope) => {
    let _ifScope = Scope();
    parentScope.addChild(_ifScope);

    return Conditional(_ifScope);
};


let ChoiceWrapper = (scope) => {
    let ret     = DoWrapper(scope);

    Object.defineProperties(ret, {
        do:{ get:() => ret },
        if:{ get: () => IfWrapper(scope)},
        app:{ get: ()=>scope.INTERNAL_app },
        data:{ get: ()=>scope.INTERNAL_data },
    });

    return ret
};

let Conditional = (ifScope) => {
    let _isInverted = false;

    let _internals = (...guards) => (...methods) => {
        // make sure there are no undefined etc.
        for(let i = guards.length - 1; i >= 0; i--){
            // we allow for null to be added for the sake of conditional
            // scope creation but it is removed at this point
            if(guards[i] === null){
                methods.splice(i, 1);

            } else if(typeof guards[i] !== 'function'){
                throw new Error(`Only functions can be added as guards. Element ${i}`
                    + ` of event: ${ifScope.event} is of type: ${typeof guards[i]}!`);
            }
        }

        let _Conditional = {};
        let _methodRunner = MethodRunner(ifScope).apply(null, methods);

        ifScope.addChild(_Conditional);

        _Conditional.run = (data, app, next) => {
            data.debug.type = 'guard';
            for(let i = 0, l = guards.length, guard, isTrue; i < l; i++) {
                guard = guards[i];
                isTrue = guard(data, app);
                _isInverted && (isTrue = !isTrue);

                data.debug.isLoggable && data.debug.addToStack(log(data, guard, isTrue));

                if(!isTrue) {
                    return next();
                }
            }

            data.debug.increaseDepth();

            _methodRunner.run(data, app, ()=> {
                ifScope.completeScope();
                data.debug.decreaseDepth();
                next();
            });
        };

        let ret     = DoWrapper(ifScope.parent);
        ret.do      = ret;

        ret.if      = IfWrapper(ifScope.parent);
        ret.elseif  = Conditional(ifScope);
        ret.else    = Conditional(ifScope)(()=>true);

        // TODO - dont like this implementation of else

        return ret;
    };

    _internals.not = (...guards) => {
        _isInverted = true;
        return _internals.apply(null, guards);
    };

    return _internals;
};


let MethodRunner = scope => (...methods) => {

    // make sure there are no undefined etc.
    for(let i = methods.length - 1; i >= 0; i--){
        // we allow for null to be added for the sake of conditional
        // scope creation but it is removed at this point
        if(methods[i] === null){
            methods.splice(i, 1);

        } else if(typeof methods[i] !== 'function'){
            throw new Error(`Only functions can be added to MethodRunner. Element ${i}`
                + ` of event: ${scope.event} is of type: ${typeof methods[i]}!`);
        }
    }

    let _MethodRunner = {};

    _MethodRunner.run = (data, app, next) => {
        let iterator = Iterator(methods);

        let loop = async () => {
            if(!iterator.hasNext()) return next();
            let method = iterator.next();
            try {
                switch (method.length) {
                    case 1:
                        data.debug.type = 'scope';
                        data.debug.isLoggable && data.debug.addToStack(log(data, method));
                        // remove scope creation methods and add scope hierarchy
                        // to the main structure to increase speed on later runs

                        // TODO - now the whole thing is a new scope every time
                        // so this doesn't make sense unless we start caching

                        //iterator.removeLastIndex();
                        let newScope = Scope();
                        //scope.addChild(newScope);

                        // as our method is a scope we must pass a ChoiceWrapper
                        // through with it as thats where the useful methods are.
                        method(ChoiceWrapper(newScope));
                        data.debug.increaseDepth();
                        newScope.run(data, app, () => {
                            data.debug.decreaseDepth();
                            loop();
                        });
                        break;

                    case 2:
                        data.debug.type = 'method';
                        data.debug.isLoggable && data.debug.addToStack(log(data, method));
                        await method(data, app);
                        loop();
                        break;

                    case 3:
                        data.debug.type = 'method';
                        data.debug.isLoggable && data.debug.addToStack(log(data, method));
                        method(data, app, loop);
                        break;

                    default:
                        throw new Error('Reflow middleware must accept 1-3 arguments!');
                }
            } catch (err){
                data.debug.isLoggable && data.debug.addToStack(log(data, method));
                console.log(' ');
                method && console.log(`!!!!!! There has been an error @${method.name}!!!!!!!`);
                console.log(`reflow stack for event: ${data.event}`);
                console.log(err.message);
                data.debug.logStack();
                console.log('\n JS stack:');
                console.log(err);
            }
        };
        loop();
    };

    return _MethodRunner;
};

module.exports = {
    Scope,
    ChoiceWrapper
};