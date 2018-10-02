'use strict';

let interfaceEqualTo = iFace => (data, app) => {
    data.debug.overrideMethodName('data.params.interface is equal to ' + iFace.name);
    return data.params.interface === iFace;
};

module.exports = interfaceEqualTo;