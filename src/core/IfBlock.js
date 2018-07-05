'use strict';

let Conditional         = require('./Conditional');
let Scope               = require('./Scope');

let IfBlock = (parentScope) => {
    let _IfBlock = Scope();
    parentScope.addChild(_IfBlock);

    return Conditional(_IfBlock);
};

module.exports = IfBlock;