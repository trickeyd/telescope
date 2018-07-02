'use strict';

let _assetManager = {};

let _imageConfigs = [];
let _nameCheck = Object.create(null);
let _constantToImage = Object.create(null);


let ImageInfo = (_id, name, image) => {
    return { _id, name, image };
};

_assetManager.registerConstants = constToAssetManifest => {
    Object.keys(constToAssetManifest).forEach(key => {
        if(_constantToImage[key])
            throw(new Error('Image id already registered to constant: ' + key +'!'));

        let value = constToAssetManifest[key];
        if(typeof value === 'string'){
            _constantToImage[key] = _assetManager.getImageById(value);
        } else if(Array.isArray(value)) {
            _constantToImage[key] = value.map(arrayValue => _assetManager.getImageById(arrayValue));
        } else {
            throw(new Error('Object type:'+typeof value+' is not supported as asset constant!'));
        }
    });
};

_assetManager.registerImagesWithPostfixCounter = (images, name, startCount) => {
    startCount = startCount || 0;
    let ids = [];
    images.forEach(image => ids[ids.length] = _assetManager.registerImage(image, name + startCount++));
    return ids;
};

_assetManager.registerImage = (image, name) => {
    if(_nameCheck[name]) throw(new Error('Image with the name: '+ name +' already registered!'));
    let id = name ? _imageConfigs.length + '_' + name : _imageConfigs.length;
    let info =  ImageInfo(id, name, image);
    _imageConfigs[_imageConfigs.length] = info;
    name && (_nameCheck[name] = info);
    return id;
};

_assetManager.getImageByName = (name) => {
    if(!_nameCheck[name]) throw(new Error('Image with the name '+ name +' has not been registered!'));
    let imageInfo = _imageConfigs.find(imageInfo => imageInfo.name === name);
    return imageInfo.image;
};

_assetManager.getImageById = (id) => {
    let imageInfo = _imageConfigs.find(imageInfo => imageInfo._id === id);
    return imageInfo.image;
};

_assetManager.getImageByKey = constSelectMethod => {
    return constSelectMethod(Object.assign({}, _constantToImage));
};

export default _assetManager;