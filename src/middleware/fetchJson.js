'use strict';

let Call = (data, isSuccess, body) => {
    return { data, isSuccess, body };
};

/**
 *
 * @param url - url of the server call
 * @param body {object}
 * @param isSuccess {function} [defaultDetermineSuccess] - function that takes res object and determines success
 * @param method {string} ['POST'] - method of server call
 * @param headers {object} [{
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }]
 * @returns {function(object, object)} - middleware
 */
let fetchJson = (url, body, method, headers, isSuccess) => {
    if(!url) throw(new Error('fetchJson middleware requires a url!'));

    isSuccess = isSuccess || defaultDetermineSuccess;
    method = method || 'POST';
    headers = headers || {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    let fetchJson = async (data, app) => {
        let bodyString = body ? JSON.stringify(body) : undefined;

        let res = await fetch(url, {
            method : method,
            headers : headers,
            body : bodyString
        });

        let callIsSuccessful = isSuccess(res);

        res = await res.json();

        return data.calls[url] = data.calls.lastCall = Call(res, callIsSuccessful, body);
    };
    return fetchJson;
};

let defaultDetermineSuccess = res => (res.status >= 200) && (res.status <= 299);

export default fetchJson;