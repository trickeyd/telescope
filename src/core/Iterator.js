'use strict';

let Iterator = (array) => {
    let _Iterator = {};
    let _index = 0;
    let _length = array.length;

    _Iterator.hasNext = () => _index < _length;
    _Iterator.next = () => array[_index++];

    return _Iterator;
};

module.exports = Iterator;