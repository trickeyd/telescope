import { Scope } from './core/core';
import { ChoiceWrapper } from './core/core';
import { map } from './core/applicationMap';
import globalEmitter from './globalEmitter';

let _answers = ['m1', 'm2', 'm4.5', 'm5', 'm6', 'm9', 'm10', 'm13', 'm14', 'm15', 'm16', 'm17', 'm18']; 
let mid = log => (data, app) => {
    const expecting = _answers.shift();
    if(log !== expecting) throw new Error(`Expecting ${expecting}, got ${log}`);
    data.debug.log(log);
};

let globalScope = Scope();
let testChoice = ChoiceWrapper(globalScope);

map.on('poo', 
    scope=>scope(
        mid('m1'),
        mid('m2')
    ).if(()=>false)(
       mid('m4')
    ).elseif(()=>true)(
       (data, app, next) => {
           mid('m4.5')(data, app);
           next();
       },
       mid('m5'),
       mid('m6')
    ).elseif(()=>true)(
       mid('6.5')
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
           mid('m16')
       ).if(()=>true)(
           mid('m17')
       )
    )(
       mid('m18')
    )
);

//ev.emit('poo');

setTimeout(()=>globalEmitter.emit('poo'), 1000);
