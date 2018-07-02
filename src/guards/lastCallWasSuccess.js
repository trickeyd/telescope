'use strict';

export default function (data, app) {
    return !!(data.calls.lastCall && data.calls.lastCall.isSuccess);
};