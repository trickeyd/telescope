'use strict';

let MethodRunner        = require('./MethodRunner');
let ChoiceBlock         = require('./ChoiceBlock');

let DoBlock = (parentScope) => (...methods) => {
    let _DoBlock = {};
    let runner = MethodRunner.apply(null,methods);

    _DoBlock.run = runner.run;

    parentScope.addChild(_DoBlock);

    return ChoiceBlock(parentScope);
};

module.exports = DoBlock;