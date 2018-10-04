'use strict';

let Iterator = (array) => {
    let _Iterator = {};
    let _index = 0;
    let _array = array.concat();
    let _length = _array.length;

    _Iterator.hasNext = () => _index < _length;
    _Iterator.next = () => _array[_index++];
    _Iterator.removeLastIndex = () => {
        _array.splice(--_index, 1);
        _length--;
    };

    return _Iterator;
};

module.exports = Iterator;