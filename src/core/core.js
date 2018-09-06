'use strict';

let Iterator        = require('./Iterator');
let _               = require('lodash');

let log = (data, method, isTrue=undefined) => {
    let threadId    = data.threadId + '';
    let event       = data.event;
    let depth       = data.debug.depth;
    let debug       = data.debug.debugString;

    let string;
    switch(data.debug.type){
        case 'scope':
            string = 'scope =>';
            break;
        case 'method':
            string = 'Method';
            break;
        case 'guard':
            string = 'Guard';
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
}

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
    let _IfBlock = Scope();
    parentScope.addChild(_IfBlock);

    return Conditional(_IfBlock);
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

                data.debug.isLoggable && log(data, guard, isTrue);

                data.debug.addToStack(guards[i].name, isTrue);

                if(!isTrue) {
                    return next();
                }
            }

            data.debug.depth++;

            _methodRunner.run(data, app, ()=> {
                ifScope.completeScope();
                data.debug.depth--;
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

            try {

                switch (method.length) {
                    case 1:
                        data.debug.type = 'scope'
                        let str = 'scope ->';
                        log(data, method);
                        // remove scope creation methods and add hierarchy
                        // to the structure to increase speed on later runs
                        iterator.removeLastIndex();
                        let newScope = Scope();
                        scope.addChild(newScope);
                        method(ChoiceBlock(newScope));
                        data.debug.depth++;
                        return newScope.run(data, app, () => {
                            data.debug.depth--;
                            loop();
                        });

                    case 2:
                        data.debug.type = 'method';
                        data.debug.isLoggable && log(data,  method);

                        await method(data, app);
                        return loop();

                    case 3:
                        data.debug.type = 'method';
                        data.debug.isLoggable && log(data, method);

                        data.debug.addToStack(method.name);
                        return method(data, app, loop);

                    default:
                        throw(new Error('Reflow middleware must accept 1-3 arguments!'));
                }
            } catch (err){
                console.log('ERROR!');
                console.log('There has been an error @ ' + method.name + '!');
                console.log('reflow stack:');
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
    Scope
};