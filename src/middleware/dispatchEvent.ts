/**
 *
 * @param event
 * @param payload
 * @returns {function(*, *)}
 */
let dispatchEvent = (event, payload) => {
    if(!event) throw(new Error('event required for dispatchEvent middleware!'));

    let dispatchEvent = async (data, app) => {
        app.emitter.emit(event, payload);
    };
    return dispatchEvent;
};

export default dispatchEvent;
