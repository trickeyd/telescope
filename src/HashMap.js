"use strict";

module.exports = function HashMap () {
    let HashMap = {};
    let _keyArray = [];
    let _propertyArray = [];

    // added for debugging
    Object.defineProperty(HashMap, "toString", {
        get: function () {
            let string = "";
            for (let i = _keyArray.length - 1; i>=0; i--) {
                string += (String(_keyArray[i]) + "->" + String(_propertyArray[i]));
            }
            return string;
        }
    });

    Object.defineProperty(HashMap, "keys", {
        get: function () {
            return _keyArray.concat();
        }
    });

    HashMap.set = (key, property) => {
        for (let i = 0, l = _keyArray.length; i < l; i++) {
            if(_keyArray[i] === key){
                _propertyArray[i] = property;
                return;
            }
        }
        _keyArray.push(key);
        _propertyArray.push(property);
    };

    HashMap.get = key => {
        return returnObject(_keyArray, key, _propertyArray);
    };

    HashMap.delete = key => {
        for (let i = 0, l = _keyArray.length; i < l; i++) {
            if(_keyArray[i] === key){
                _keyArray.splice(i, 1);
                _propertyArray.splice(i, 1);
                return;
            }
        }
    };

    HashMap.retrieveKey = key => {
        return returnObject(_propertyArray, key, _keyArray);
    };

    let returnObject = (searchArray, property, returnArray) => {
        for (let i = 0, l = searchArray.length; i < l; i++) {
            if(searchArray[i] === property){
                return returnArray[i];
            }
        }
        return null;
    };

    return HashMap;
};
