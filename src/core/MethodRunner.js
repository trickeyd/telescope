'use strict';

let Iterator        = require('./Iterator');
let ChoiceBlock     = require('./ChoiceBlock');

let MethodRunner = (...methods) => {
    let run = (next) => {
        let iterator = Iterator(methods);

        let loop = () => {
            console.log('method loop');
            if(!iterator.hasNext()) return next();
            let method = iterator.next();

            switch(method.length){
                case 1:
                    let scope = Scope();
                    method(ChoiceBlock(scope));
                    scope.run(loop);
                    break;
                case 2:
                    method();
                    loop();
                    // (data, app)
                    break;
                case 3:
                    // (data, app, next)

                    method(null, null, loop);
                    break;
                case 4:
                    // (err, data, app, next) need this?
                    break;
            }
        };

        loop();
    };

    return {
        run
    }
};

module.exports = MethodRunner;