'use strict';

let ChoiceBlock = require('./core/ChoiceBlock');
let Conditional = require('./core/Conditional')
let DoBlock = require('./core/DoBlock')
let Iterator = require('./core/Iterator')
let MethodRunner = require('./core/MethodRunner')

let IfBlock = require('./core/IfBlock')
let Scope = require('./core/Scope');

console.log(ChoiceBlock);
console.log(Conditional);
console.log(DoBlock);
console.log(Iterator);
console.log(MethodRunner);
console.log(IfBlock);
console.log(Scope);

let mid = log => (data, app) => console.log(log);

let globalScope = Scope();
let testChoice = ChoiceBlock(globalScope);

testChoice.do(
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

globalScope.run(()=>console.log('finished'));

/*on('event').do(
    middleware,
    middleware,
    myScope
).if(guard)(
    scope => scope.do(
        middleware,
        middleware
    ),
    middleware,
    middleware
);*/


/*


on(event), (scope, if) => scope(
    (data, app) => app.model.doSomething(),
    (data, app) => app.model.doSomething(),
    If(guards)(
        scope => scope(
            (data, app) => app.model.doSomething(),
            (data, app) => app.model.doSomething(),
            (data, app) => app.model.doSomething(),
        ),
        (data, app) => app.model.doSomething(),
        (data, app) => app.model.doSomething()
    ).elseIf(guards)(
        (data, app) => app.model.doSomething(),
        (data, app) => app.model.doSomething(),
        (data, app) => app.model.doSomething()
    ).else(
        (data, app) => app.model.doSomething(),
        (data, app) => app.model.doSomething(),
        (data, app) => app.model.doSomething()
    )
))



on(event, scope => scope
(
    doSomething
).if(guards)(scope => scope(
            doSomething,
            (scope) => { scope.do(
                (data, app) => app.model.doSomething(),
                (data, app) => app.model.doSomething(),
                (data, app) => app.model.doSomething()
            }).if(guard)(
                (data, app) => app.model.doSomething(),
                (scope) => scope.do(
                    (data, app, next) => {
                        app.model.doSomething();
                        next();
                    }
                )
                (data, app) => app.model.doSomething()
            ).elseIf(guard, guard)(
                (data, app) => app.model.doSomething(),
                (data, app) => app.model.doSomething()
            ).else(
                (data, app) => app.model.doSomething(),
                (data, app) => app.model.doSomething()
            )
        )
    ).if(guard)(
        (data, app) => app.model.doSomething()
    ).do(
        (data, app) => app.model.doSomething()
    )
)

on(event).do(scope => scope(
    thing
)



).if(guard)(
    thing,
    thing
).elseIf(guard)(
    thing
).else(
    thing
).do(
    thing
)

if [
    conditional,
    conditional,
    conditional,
    conditional
]

conditional {
    guard:[guards],
    scopes:[scopes]
}

scope [
    scope,
    if,
    scope
]



[
    "fun",
    "fun",

    { "if": [ "g1", "g2" ] }, [
        "fun",
        "fun"
    ],
    { "elseIf" : [] }, [
        "fun",
        { "if": [ "g1", "g2" ] }, [
            "fun",
            "fun"
        ]
    ]

]*/
