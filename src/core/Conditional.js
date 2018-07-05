'use strict';

let MethodRunner        = require('./MethodRunner');
let DoBlock             = require('./DoBlock');
let IfBlock             = require('./IfBlock');

let Conditional = (ifScope) => (...guards) => (...methods) => {
    let _Conditional = {};
    let _methodRunner = MethodRunner.apply(null, methods);

    _Conditional.run = (next) => {
        for(let i = 0, l = guards.length; i < l; i++) {
            if(!guards[i]()){
                return next();
            }
        }
        ifScope.completeScope();
        _methodRunner.run(next);
    };

    ifScope.addChild(_Conditional);

    return {
        get else()  { return Conditional(ifScope)(()=>true) },
        get elseIf(){ return Conditional(ifScope) },
        get do()    { return DoBlock(ifScope.parent) },
        get if()    { return IfBlock(ifScope.parent) }
    }
};

module.exports = Conditional;