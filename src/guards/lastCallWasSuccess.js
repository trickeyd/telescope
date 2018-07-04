'use strict';

export default function lastCallWasSuccess (data, app) {
    return !!(data.calls.lastCall && data.calls.lastCall.isSuccess);
};