interface Action {
  type: string
  payload: object
}

type Listener = (action: Action) => void

interface MapObject {
  eventType: string
  listener: Listener
  isOnce: boolean 
}

interface OnChain {
  to: (listener: Listener) => OnChain
  call: (Listener: Listener) => OnChain
  once: (isOnce: boolean) => OnChain
}

interface UnmapChain {
  from: (listener: Listener) => void
}

interface Chain {
  on: (eventType: string) => OnChain
  unmap: (eventType: string) => UnmapChain
  unmapAll: () => void
  mappingExists: (eventType: string, listener: Listener) => boolean 
  emit: (action: Action) => void 
}

const Emitter = (): Chain => {
  let _mapListenersByType = Object.create(null);

  const on = (eventType: string): OnChain => {
    const mapObjects = _mapListenersByType[eventType] = _mapListenersByType[eventType] || []; 
    const mapObject: MapObject = { eventType: eventType, listener: null, isOnce: false};

    const to = (listener: Listener): OnChain => {
      if(mappingExists(eventType, listener)){
          throw(new Error("Mapping for "+ eventType +" already exists with this listener!"));
      }
      mapObject.listener = listener;
      mapObject.eventType = eventType;
      mapObjects.push(mapObject);
      return chain; 
    };

    const once = (isOnce: boolean = true): OnChain => {
      mapObject.isOnce = isOnce;
      return chain;
    };

    const chain: OnChain = {
      to,
      call: to,
      once
    }

    return chain;
  };


  const unmap = (eventType: string): UnmapChain => {
    const mapObjects = _mapListenersByType[eventType];
    const from = (listener: Listener) => {
      if (mapObjects) {
        for (let i = mapObjects.length - 1; i >= 0; i--) {
          let mapObject = mapObjects[i];
          if (mapObject.listener === listener) {
            mapObjects.splice(i, 1);
            return;
          }
        }
        throw(new Error("Unmapping listener that is not mapped to "+event+"!"));
      }
    };
    return { from };
  };


  const unmapAll = (): void => {
    _mapListenersByType = Object.create(null);
  };


  const mappingExists = (eventType: string, listener: Listener): boolean => {
    const mapObjects = _mapListenersByType[eventType];
    return !!mapObjects && !!mapObjects.find(listener)
  };


  const emit = (action: Action): void => {
    if(!action.type) throw(new Error("Action.type is undefined"));
    const listenerConfigs = _mapListenersByType[action.type];
    if(listenerConfigs) {
      for (let i = 0, l = listenerConfigs.length, config: MapObject; i < l; i++) {
        config = listenerConfigs[i];
        config.isOnce && unmap(action.type).from(config.listener);
        config.listener(action);
      }
    }
  };


  return {
    on,
    unmap,
    unmapAll,
    mappingExists,
    emit
  };
};

export default Emitter;
