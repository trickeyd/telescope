export interface App {
  model: any
  service: any
  events: any
  emitter: any
  debug: any
} 

export const createAppObject = (): App => ({
  get model() { return {} },
  get service() { return {} },
  get events() { return {} },
  get emitter() { return {} },
  get debug() { return {} }
  /*
  getProxyByType: { writable: false, enumerable: true, value: proxies.getProxyByType },
  getInstanceByType: { writable: false, enumerable: true, value: proxies.getInstanceByType },*/
})
