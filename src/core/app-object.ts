import assetManager from "../assetManager";
import emitter from "../globalEmitter";
import proxies from "./proxies";

export interface App {
  modal: any
  service: any
  events: any
  emitter: any
  debug: any
} 

export const createAppObject = (model: any, service: any, events: any) => ({
  get model() { return modal },
  get service() { return service },
  get events() { return events },
  get emitter() { return emitter },
  get debug() { return {} }
  /*assetManager: { writable: false, enumerable: true, value: assetManager },
  getProxyByType: { writable: false, enumerable: true, value: proxies.getProxyByType },
  getInstanceByType: { writable: false, enumerable: true, value: proxies.getInstanceByType },*/
})
