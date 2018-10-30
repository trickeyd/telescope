'use strict';

let Scope = require('./core/core').Scope;
let map = require('./core/applicationMap');
let ev = require('./globalEmitter');

let mid = log => {
    let hello = (data, app) => console.log(log);
    return hello;
};

let globalScope = Scope();
let testChoice = ChoiceWrapper(globalScope);



map.on('poo')(
    mid('m1'),
    mid('m2')
).if(()=>false)(
    mid('m3'),
    mid('m4')
).elseif(()=>true)(
    (data, app, next) => {
        console.log('nexty');
        next();
    },
    mid('m5'),
    mid('m6')
).elseif(()=>true)(
    mid('FUUUUUUUUKKKKKK!!!!')
).else(
    mid('m7'),
    mid('m8')
)(
    mid('m9')
)(
    mid('m10')
).if(()=>false)(
    mid('m11'),
    scope => scope(
        mid('m12')
    )
).else(
    mid('m13'),
    scope => scope(
        mid('m14'),
        mid('m15')
    ).if(()=>true)(
        mid('m16'),
    ).if(()=>true)(
        mid('m17')
    )
)(
    mid('m18')
);

console.log('.');
console.log('.');
console.log('.');

ev.emit('poo');

setTimeout(()=>ev.emit('poo'), 1000);