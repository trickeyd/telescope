'use strict';

let Iterator        = require('./Iterator');


let Scope = () => {
    let _Scope = {};

    let _children = [];
    let _isCompleted = false;

    _Scope.parent = null;

    _Scope.addChild = child => {
        _children[_children.length] = child;
        child.parent = _Scope;
    };

    _Scope.completeScope = () => _isCompleted = true;
    _Scope.getIsComplete = () => _isCompleted;

    _Scope.run = (data, app, next) => {
        let iterator = Iterator(_children);

        let loop = () => {
            if(_isCompleted || !iterator.hasNext()) return next();
            let child = iterator.next();
            child.run(data, app, loop);
        };

        loop();
    };

    return _Scope;
};


let DoBlock = (parentScope) => (...methods) => {
    let _DoBlock = {};
    let runner = MethodRunner.apply(null,methods);

    _DoBlock.run = runner.run;

    parentScope.addChild(_DoBlock);

    return ChoiceBlock(parentScope);
};


let IfBlock = (parentScope) => {
    let _IfBlock = Scope();
    parentScope.addChild(_IfBlock);

    return Conditional(_IfBlock);
};


let Conditional = (ifScope) => (...guards) => (...methods) => {
    let _Conditional = {};
    let _methodRunner = MethodRunner.apply(null, methods);

    _Conditional.run = (data, app, next) => {
        for(let i = 0, l = guards.length; i < l; i++) {
            if(!guards[i]()){
                return next();
            }
        }
        ifScope.completeScope();
        _methodRunner.run(data, app, next);
    };

    ifScope.addChild(_Conditional);

    return {
        get else()  { return Conditional(ifScope)(()=>true) },
        get elseIf(){ return Conditional(ifScope) },
        get do()    { return DoBlock(ifScope.parent) },
        get if()    { return IfBlock(ifScope.parent) }
    }
};

let ChoiceBlock = (scope) => {
    return {
        get do() { return DoBlock(scope) },
        get if() { return IfBlock(scope) }
    }
};

let MethodRunner = (data, app, ...methods) => {
    let run = (data, app, next) => {
        let iterator = Iterator(methods);

        let loop = async () => {
            if(!iterator.hasNext()) return next();
            let method = iterator.next();

            try {
                switch (method.length) {
                    case 1:
                        let scope = Scope();
                        method(ChoiceBlock(scope));
                        scope.run(loop);
                        break;
                    case 2:
                        await method(data, app);
                        loop();
                        break;
                    case 3:
                        method(data, app, loop);
                        break;
                    case 4:
                        // (err, data, app, next) need this?
                        break;
                }
            } catch (err){
                console.log('Error!');
            }
        };
        loop();
    };

    return {
        run
    }
};

module.exports = {
    ChoiceBlock,
    Scope
};