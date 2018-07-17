let assetManager = require('./assetManager');
let globalEmitter  = require('./globalEmitter');
let applicationMap  = require("./core/applicationMap");
let _ = require('lodash');

let ComponentAccess = (target, addMethodsToComponent = true, callCreateMappingsOnComponent = true) => {

    let getViewModel = target => {
        let viewModelClass = applicationMap.getViewModelByView(target.constructor);
        return viewModelClass ? new viewModelClass(applicationMap.cloneAppObject()) : null;
    };

    let _ComponentAccess = {};

    let _addMethods = addMethodsToComponent;
    let _callCreateMappings = callCreateMappingsOnComponent;
    let _target = target;
    let _targetName = _target && _target.constructor ? _target.constructor.name  : '[Name not supplied]';
    let _viewModel = getViewModel(target);

    let _hasMappings = false;

    _ComponentAccess.createMappings = callback => {
        if (_hasMappings) {
            console.warn('WARNING :: ComponentAccess for target: ' + _targetName + ' is not being disposed. '
                + 'If componentDidMount is overridden you must call its super method or this._dispose');
        }
        callback(function(eventName){
            if(arguments.length > 1)
                throw(new Error('EventDispatcher.on requires one argument. Use on().to() to add listener!'));
            return globalEmitter.on(eventName).withGroupIdentifier(_ComponentAccess)
        });
        _hasMappings = true;
    };

    _ComponentAccess.removeMappings = () => {
        if(!_hasMappings) {
            console.warn('WARNING :: ComponentAccess for target ' + _targetName + ' has not been initialised. '
                + 'If componentWillMount is overridden you must call its super method or this.setup');
        }
        globalEmitter.unmapByIdentifier(_ComponentAccess);
        _hasMappings = false;
    };

    _ComponentAccess.emit = (eventType, ...payload) => {
        payload.unshift(eventType);
        return globalEmitter.emit.apply(null, payload);
    };

    _ComponentAccess.getImageByName = imageName => {
        return assetManager.getImageByName(imageName);
    };

    _ComponentAccess.getImageByKey = constSelectMethod => {
        return assetManager.getImageByKey(constSelectMethod);
    };

    Object.defineProperties(_ComponentAccess, {
        viewModel:{get: () => _viewModel }
    });

    if(_addMethods) {

        // add getter for view model to target
        Object.defineProperties(_target, {
            viewModel:{get: () => _viewModel }
        });

        // add new component methods to target
        _target.emit = _ComponentAccess.emit;
        _target.getImageByName = _ComponentAccess.getImageByName;
        _target.getImageByKey = _ComponentAccess.getImageByKey;

        // decorate component did mount
        _target.componentDidMount = (fn => {
            return function() {
                let proxy = applicationMap.getComponentProxy(_target.constructor);
                _.isNil(proxy) || proxy._INTERNAL_addInstance(_target);

                if (_callCreateMappings && _.isFunction(_target.createMappings)) {
                    _ComponentAccess.createMappings(_target.createMappings.bind(_target));
                }
                fn && fn.call(_target);
            }
        })(_target.componentDidMount);

        // decorate component will unmount
        _target.componentWillUnmount = (fn => {
            return function() {
                let proxy = applicationMap.getComponentProxy(_target.constructor);
                _.isNil(proxy) || proxy._INTERNAL_removeInstance(_target);

                _hasMappings && _ComponentAccess.removeMappings();
                fn && fn.call(_target);
            }
        })(_target.componentWillUnmount);
    }

    applicationMap.componentMixins.forEach(mixin => {
        mixin(_target);
    });

    return _ComponentAccess;
};

module.exports = ComponentAccess;