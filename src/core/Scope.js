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

    _Scope.run = (next) => {
        let iterator = Iterator(_children);

        let loop = () => {
            console.log('scope loop');
            if(_isCompleted || !iterator.hasNext()) return next();
            let child = iterator.next();
            child.run(loop);
        };

        loop();
    };

    return _Scope;
};

module.exports = Scope;