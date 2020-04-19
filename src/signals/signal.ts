import { Schema, parseSchemaNode } from "../model/schema-model/schema";
import { SchemaNode } from "../model/schema-model/types";
import { validateValueBySchemaNode } from "../model/schema-model/validation";
import { stringify } from "../utils/strings";

interface Config {
  isOnce: boolean
  interval: number
}

type Listener<T> = (payload?: T) => void 

export interface Signal<T = undefined>  {
  on: (listener: Listener<T>) => void
  once: (listener: Listener<T>) => void
  cron: (listener: Listener<T>, interval: number, emitImediatly: boolean,  numEmitions: number) => void
  emit: (payload?: T) => void
  un: (listener: Listener<T>) => void 
  has: (listen: Listener<T>) => boolean
}

export const Signal = <T extends any = any>(schemaNode?: SchemaNode): Signal<T> => {
  const parsedSchemaNode = schemaNode ? parseSchemaNode('signal', schemaNode) : undefined
  const listeners: Map<Listener<T>, Function> = new Map(); 

  return {
    on (listener) {
      if(listeners.has(listener)) throw new Error("Listener already added")
      listeners.set(listener, listener)
    },
    once (listener) {
      if(listeners.has(listener)) throw new Error("Listener already added")
      const selfRemovingListener = (payload: T) => {
        listeners.delete(listener)
        listener(payload)
      }
      listeners.set(listener, selfRemovingListener)
    },
    cron (listener, interval, emitImmediately = true, numEmissions = Infinity) {
      if(listeners.has(listener)) throw new Error("Listener already added")
      const timedListener = () => {
        if(listeners.has(listener)){
          if(--numEmissions > 0) {
            listener()
            setTimeout(timedListener, interval)
          } else {
            listeners.delete(listener) 
            listener()
          }
        }
      }
      listeners.set(listener, () => {})
      emitImmediately ? timedListener() : setTimeout(timedListener, interval)
    },
    un (listener: Listener<T>) {
      if(!listeners.delete(listener)) throw new Error("Listener not added") 
    }, 
    emit (payload) {
      const { isValid, validationMap } = parsedSchemaNode 
        ? validateValueBySchemaNode(payload, parsedSchemaNode)
        : { isValid : true, validationMap: {} } 

      if(!isValid)
        throw Error(`Signal has invalid payload\n${stringify(validationMap)}`) 

      listeners.forEach(listener => listener(payload))
    },
    has (listener: Listener<T>) {
      return listeners.has(listener)
    }
  }
}
