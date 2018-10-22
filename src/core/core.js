'use strict';

let Iterator        = require('./Iterator');
let _               = require('lodash');

let log = (data, method, isTrue=undefined) => {
    let event       = data.event;
    let depth       = data.debug.depth;
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

let Scope = () => {
    let _Scope = {};

    let _children = [];
    let _isCompleted = false;

    _Scope.parent = null;

    _Scope.addChild = (child) => {
        _children[_children.length] = child;
        child.parent = _Scope;
    };

    _Scope.completeScope = () => _isCompleted = true;
    _Scope.getIsComplete = () => _isCompleted;

    _Scope.run = (data, app, next) => {
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
    return {
        get do() { return DoWrapper(scope) },
        get if() { return IfWrapper(scope) }
    }
};

let Conditional = (ifScope) => {
    let _isInverted = false;

    let _internals = (...guards) => (...methods) => {
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

        return {
            get else()  { return Conditional(ifScope)(()=>true) },
            get elseIf(){ return Conditional(ifScope) },
            get do()    { return DoWrapper(ifScope.parent) },
            get if()    { return IfWrapper(ifScope.parent) }
        }
    };

    _internals.not = (...guards) => {
        _isInverted = true;
        return _internals.apply(null, guards);
    };

    return _internals;
};


let MethodRunner = scope => (...methods) => {

    // make sure there are no undefined etc.
    for(let i = methods.length - 1; i <= 0; i--){
        if(typeof methods[i] !== 'function'){
            throw(new Error('Only functions can be added to MethodRunner. Attempted to add: '
                + typeof methods[i]));
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

                        // TODO- now the whole thing is a new scope every time
                        // so this doesn't make sense unless we start caching

                        //iterator.removeLastIndex();
                        let newScope = Scope();
                        //scope.addChild(newScope);

                        // as our method is a scope we must pass a ChoiceWrapper
                        // through with it as thats where the useful methods are - do() etc.
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
                        throw(new Error('Reflow middleware must accept 1-3 arguments!'));
                }
            } catch (err){
                data.debug.isLoggable && data.debug.addToStack(log(data, method));
                console.log(' ');
                method && console.log('!!!!!! There has been an error @ ' + method.name + ' !!!!!!!');
                console.log('reflow stack for event: ' + data.event);
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
    ChoiceBlock: ChoiceWrapper,
    Scope,
    MethodRunner
};