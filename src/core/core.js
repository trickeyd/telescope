'use strict';

let Iterator        = require('./Iterator');
let _               = require('lodash');

let log = (data, method, isTrue=undefined) => {
    let event       = data.event;
    let depth       = data.debug.depth;
    let debug       = data.debug.debugString;

    data.debug.deleteOverideMethodName();

    let string;
    switch(data.debug.type){
        case 'scope':
            string = 'Scope => ';
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
    } else if(_.isString(method.name) && method.name !== '') {
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


let DoBlock = (parentScope) => (...methods) => {
    let _DoBlock = {};
    let runner = MethodRunner(parentScope).apply(null, methods);

    _DoBlock.run = runner.run;

    parentScope.addChild(_DoBlock);

    return ChoiceBlock(parentScope);
};


let IfBlock = (parentScope) => {
    let _ifScope = Scope();
    parentScope.addChild(_ifScope);

    return Conditional(_ifScope);
};


let ChoiceBlock = (scope) => {
    return {
        get do() { return DoBlock(scope) },
        get if() { return IfBlock(scope) }
    }
};

let Conditional = (ifScope) => {
    let _isInverted = false;

    let _internals = (...guards) => (...methods) => {
        let _Conditional = {};
        let _methodRunner = MethodRunner(ifScope).apply(null, methods);

        ifScope.addChild(_Conditional);

        _Conditional.run = (data, app, next) => {
            data.debug.type = 'guard'
            for(let i = 0, l = guards.length, guard, isTrue; i < l; i++) {
                guard = guards[i];
                isTrue = guard(data, app);
                _isInverted && (isTrue = !isTrue)

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
            get do()    { return DoBlock(ifScope.parent) },
            get if()    { return IfBlock(ifScope.parent) }
        }
    }

    _internals.not = (...guards) => {
        _isInverted = true;
        return _internals.apply(null, guards);
    }

    return _internals;
};


let MethodRunner = scope => (...methods) => {
    let _MethodRunner = {};

    _MethodRunner.run = (data, app, next) => {
        let iterator = Iterator(methods);

        let loop = async () => {
            if(!iterator.hasNext()) return next();
            let method = iterator.next();
            let newScope;
            try {

                switch (method.length) {
                    case 1:
                        data.debug.type = 'scope';
                        data.debug.isLoggable && data.debug.addToStack(log(data, method));
                        // remove scope creation methods and add scope hierarchy
                        // to the main structure to increase speed on later runs
                        iterator.removeLastIndex();
                        newScope = Scope();
                        scope.addChild(newScope);

                        // as our method is a scope we must pass a ChoiceBlock
                        // through with it as thats where the useful methods are - do() etc.
                        method(ChoiceBlock(newScope));
                        data.debug.increaseDepth();
                        return newScope.run(data, app, () => {
                            data.debug.decreaseDepth();
                            loop();
                        });

                    case 2:
                        data.debug.type = 'method';
                        data.debug.isLoggable && data.debug.addToStack(log(data, method));

                        await method(data, app);
                        return loop();

                    case 3:
                        data.debug.type = 'method';
                        data.debug.isLoggable && data.debug.addToStack(log(data, method));
                        return method(data, app, loop);

                    case 4:
                        data.debug.type = 'method';
                        data.debug.isLoggable && data.debug.addToStack(log(data, method));

                        // new scope but does not collaps as with 2 args this is
                        // so that the user can manipulate whole sections (needs more thought)
                        // also scope is not wrapped in ChoiseBlock so can be accessed directly
                        newScope = Scope();
                        method(data, app, loop, newScope);
                        return newScope.run(data, app, () => {
                            data.debug.decreaseDepth();
                            loop();
                        });

                    default:
                        throw(new Error('Reflow middleware must accept 1-3 arguments!'));
                }
            } catch (err){
                console.log(' ');
                console.log('!!!!!! There has been an error @ ' + method.name + ' !!!!!!!');
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
    ChoiceBlock,
    Scope,
    MethodRunner
};