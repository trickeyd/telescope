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

        let res;
        try{
            res = await fetch(url, {
                method : method,
                headers : headers,
                body : bodyString
            });
        } catch (err) {
            console.log('fetch failed');
            console.log(err);
        }

        let callIsSuccessful = isSuccess(res);

        let json;
        try {
            json = await res.json();
        } catch(err){
            console.log('Could not pass JSON');
        }

        if(!json){
            res.err = 0;
        } else {
            res = json;
        }

        return data.calls[url] = data.calls.lastCall = Call(res, callIsSuccessful, body);
    };

    return fetchJson;
};

let defaultDetermineSuccess = res => res && res.ok && res.status >= 200 && res.status <= 299;

module.exports = fetchJson;