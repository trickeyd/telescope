'use strict';

let lastCallWasSuccess = (data, app) => {
    return !!(data.calls.lastCall && data.calls.lastCall.isSuccess);
};

module.exports = lastCallWasSuccess;