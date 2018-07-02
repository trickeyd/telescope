'use strict';

import applicationMap from './applicationMap';

export default function middlewareRunner (event, params, sequence, isLoggable) {
    params = params || {};

    sequence.unshift({exec: applicationMap.doBeforeMethods});
    sequence.push({exec: applicationMap.doAfterMethods});


    isLoggable && console.log("!! -> ", event,'--> Starting middleware configs');
    let data = {event, params, locals: {data: {}}},
        app = applicationMap.cloneAppObject(),
        index = 0;

    let nextSequenceItem = () => {
        if (index >= sequence.length) {
            isLoggable && console.log('---------> All sections complete');
            return;
        }

        try {
            let sequenceItem = sequence[index++];
            if (sequenceItem.if) {
                isLoggable && console.log('       if --> ');

                let seqIf = sequenceItem.if;
                let guardsDoPass = true;
                for(let i = 0, l = seqIf.length; i< l; i++) {
                    let ifConfig = seqIf[i];

                    ifConfig.guards.forEach(guard => {
                        let guardPassed = guard(data, app);
                        if(!guardPassed) {
                            guardsDoPass = false;
                        }
                        isLoggable && console.log('       > guard ' + guard.name + ' is ' + guardPassed);
                    });

                    // if the guards pass the methods are executed
                    // and the sequesnce backs out of the if
                    if (guardsDoPass === true) {
                        isLoggable && console.log('            --> Starting section', ifConfig.exec);
                        // TODO - do something nicer
                        ifConfig.stop && (nextSequenceItem = () => {
                            isLoggable && console.log('     --> SequenceForceStopped');
                        });
                        macro(ifConfig.exec)(data, app, nextSequenceItem, isLoggable);
                        break;
                    }
                }
                if(!guardsDoPass){
                    nextSequenceItem();
                }
            } else if (sequenceItem.exec) {
                isLoggable && console.log('       --> Starting section', sequenceItem.exec);
                macro(sequenceItem.exec)(data, app, nextSequenceItem)

            } else {
                throw(new Error("The config has no 'if' or 'exec' properties!"));
            }

        } catch (err) {
            console.log('---------> Error ended sequence!');
            console.log(err);
            return;
        }
    };

    nextSequenceItem();
}


function macro (middlewares, isLoggable) {
    // list of middlewares is passed in and a new one is returned
    return (req, app, next) => {
        // express objects are locked in this scope and then
        // _innerMacro calls itself with access to them
        let index = 0, length = middlewares.length;

        let _innerMacro = async function (param) {
            let method = middlewares[index++];
            method && isLoggable && console.log('macro method', method.name);

            // methods are called in order and passes itself in as next
            if(index <= length){
                // if the method does not accept 'next' param
                // then next method is called automatically
                if(method.length < 3){
                    await method(req, app);
                    _innerMacro();
                } else {
                    method(req, app, _innerMacro);
                }
            } else {

                // finally, next is called
                next();
            }
        };

        _innerMacro();
    }
}
