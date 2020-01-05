let lastCallWasSuccess = (data, app) => {
    return !!(data.calls.lastCall && data.calls.lastCall.isSuccess);
};

export default lastCallWasSuccess;
