interface Iterator {
  hasNext: () => boolean
  next: () => any
  removeLastIndex: () => void
}

export default (array: any[]): Iterator => {
  let _index = 0;
  let _array = array.concat();
  let _length = _array.length;

  return Object.freeze({
    hasNext: () => _index < _length,
    next: () => _array[_index],
    removeLastIndex: () => {;
      _array.splice(--_index, 1);
      _length--;
    }
  });
};
