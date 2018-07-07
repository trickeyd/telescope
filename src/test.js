'use strict';

let ChoiceBlock = require('./core/core').ChoiceBlock;
let Scope = require('./core/core').Scope;
let map = require('./core/applicationMap');
let ev = require('./globalEmitter');

let mid = log => {
    let hello = (data, app) => console.log(log);
    return hello;
};

let globalScope = Scope();
let testChoice = ChoiceBlock(globalScope);



map.on('poo').do(
    mid('m1'),
    mid('m2')
).if(()=>false)(
    mid('m3'),
    mid('m4')
).elseIf(()=>true)(
    (data, app, next) => {
        console.log('nexty');
        next();
    },
    mid('m5'),
    mid('m6')
).elseIf(()=>true)(
    mid('FUUUUUUUUKKKKKK!!!!')
).else(
    mid('m7'),
    mid('m8')
).do(
    mid('m9')
).do(
    mid('m10')
).if(()=>false)(
    mid('m11'),
    scope => scope.do(
        mid('m12')
    )
).else(
    mid('m13'),
    scope => scope.do(
        mid('m14'),
        mid('m15')
    ).if(()=>true)(
        mid('m16'),
    ).if(()=>true)(
        mid('m17')
    )
).do(
    mid('m18')
);

console.log('.');
console.log('.');
console.log('.');

ev.emit('poo');

setTimeout(()=>ev.emit('poo'), 1000);