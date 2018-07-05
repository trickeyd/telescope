'use strict';

let DoBlock         = require('./DoBlock');
let IfBlock         = require('./IfBlock');

let ChoiceBlock = (scope) => {
    return {
        get do() { return DoBlock(scope) },
        get if() { return IfBlock(scope) }
    }
};

module.exports = ChoiceBlock;