'use strict';

let _               = require('lodash');
let _nextJobIdNum   = 0;

let DebugObject = (data, isLoggable=true) => {
    let _DebugObject = {};

    let _stack = [];
    let _depth = 0;
    let _isLoggable = isLoggable;
    let _currentDebugString = null;
    let _jobId = 'j:' + _nextJobIdNum++;

    Object.defineProperties(_DebugObject, {
        overrideMethodName:{ value : string => _currentDebugString = string },
        deleteOverrideMethodName:{ value : () => _currentDebugString = null },
        debugString: {  get: () => _currentDebugString },
        stack: { get : () => _stack },
        depth: { get : () => _depth },
        isLoggable:  { get : () => _isLoggable }
    });

    _DebugObject.addToStack = (methodName, guardResult) => {
        _stack[_stack.length] = {
            text:methodName,
            depth:data.debug.depth,
            guardResult:guardResult || null
        }
    };

    _DebugObject.logStack = () => {
        let logString = '';
        _stack.forEach(stackInfo => {
            let isGuard = stackInfo.guardResult !== null;
            let displayedDepth = isGuard ? stackInfo.depth : stackInfo.depth;
            let str = stackInfo.text;
            let indent = new Array(displayedDepth * 4 + 1).join(' ');

            if(isGuard) str = 'if(' + str +')   ('+stackInfo.guardResult+')';

            str = indent + str;

            logString += str + '\n';
        });
        console.log(logString);
    };

    _DebugObject.log = (...args) => {
        //let event       = data.event;
        //const EVT_LENGTH = 30;
        //let eventStr = _.pad(event, EVT_LENGTH);
        //if(eventStr.length > EVT_LENGTH) eventStr = eventStr.substr(0, EVT_LENGTH-3) + '...';
        let startingText = '|'+_.pad(_jobId, 15) + '|'// + eventStr + '|';
        args.unshift(_.padEnd(startingText, (_depth + 1) * 4 + startingText.length));
        console.log.apply(null, args);
    };

    _DebugObject.increaseDepth = () => _depth++;
    _DebugObject.decreaseDepth = () => _depth--;

    return _DebugObject;
};

module.exports = DebugObject;