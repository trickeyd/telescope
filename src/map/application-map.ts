import { Signal } from "../signals/signal"
import { Scope, createScope, ScopeFunction, InternalScope, createStandardInterface } from "../core/core"
import { createDataObject } from "../core/data-object";
import { App, createAppObject } from "../core/app-object";
import { Debug, createDebugObject } from "../debug/debug-object";
import { Schema } from "../model/schema-model/schema";
import { createModelFromSchema, Model } from "../model/schema-model/model";
import { Relay } from "../signals/relay";

type SignalMap = { [key: string]: Signal<unknown> }
type SignalConfig = { trigger: string, signal: Signal<unknown> } 
type SignalTriggerMap = Map<Signal<unknown>, string>
export type SignalGroupFetcher = (signals: SignalMap) => SignalConfig | SignalConfig[]
export type SignalFetcher = (signals: any) => Signal<unknown>

export type RelayMap = { [key: string]: Relay }
export type RelayFetcher = (signals: RelayMap) => Relay
 
export type ServiceMap = Map<string, any>;

type SchemaConfig = { [ key: string ] : Schema }
type ModelMap = { [ key: string ] : Model }


export interface Telescope {
  on: (signalFetcher: SignalGroupFetcher, scopeFunction: ScopeFunction) => void
  model: any
  createModels: (schemas: SchemaConfig | SchemaConfig[]) => void 
  registerSignals: (signalMaps: SignalMap | SignalMap[]) => void
  registerRelays: (relayMaps: RelayMap | RelayMap[]) => void 
  signalMap: SignalMap
  relayMap: RelayMap
}

const START_DEPTH = 0;

export const createTelescope = (): Telescope => {
  const model: ModelMap = Object.create(null)
  const signalTriggerMap: SignalTriggerMap = new Map() 
  const signalMap: SignalMap = {}
  const relayMap = {}
  
  let numberOfJobs: number = 0;

  const runScope = (trigger: string, scopeFunction: ScopeFunction) => async (payload: unknown) => {
    payload = payload || {};
    const debug: Debug = createDebugObject(`j:${numberOfJobs++}`, START_DEPTH)
    const data = createDataObject({ trigger, payload, scope: new Map(), flow: new Map()})
    const app = createAppObject(model, {}, debug, relayMap)
    const scope: InternalScope = createScope();

    app.log("EMITTED  |-------------->  " + trigger, payload);
    scopeFunction(createStandardInterface(scope)) 
    await scope.exec(data, app)
    app.log('COMPLETE |<--------------  ' + trigger);
  }
  
  return {
    on(signalFetcher: SignalGroupFetcher, scopeFunction: ScopeFunction) {
      const signalArray = enforceArray(signalFetcher(signalMap))
      signalArray.forEach(signal => {
        if(signal === undefined)
          throw new Error('Signal undefined. Signals must be registered before they can be mapped')
        
        const trigger = signalTriggerMap.get(signal)
        if(!trigger) throw new Error('Supplied signal has not been registered')

        signal.on(runScope(trigger, scopeFunction)) 
      })  
    },
    createModels(schemas: SchemaConfig | SchemaConfig[]) {
      enforceArray(schemas).reduce((outerAcc: ModelMap, schemaConfig: SchemaConfig) =>
        Object.entries(schemaConfig).reduce(
          (acc: ModelMap, [key, value]: [string, Schema]) => {
            if(acc[key]) throw new Error('Multiple schemas supplied and the same name')
            model[key] = createModelFromSchema(key, value)
            return model
          },
          outerAcc
        ),
        model
      )
    },
    registerSignals (signalMaps: SignalMap | SignalMap[]) {
      enforceArray(signalMaps).reduce((signalMapOut: SignalMap, signalMapIn: SignalMap) =>
        Object.entries(signalMapIn).reduce(
          (acc: SignalMap, [key, value]: [string, Signal<unknown>]) => {
            if(acc[key]) throw new Error(`Multiple Signals have been applied to the key ${key}`)
            signalTriggerMap.set(value, key)
            acc[key] = value
            return acc
          },
          signalMapOut
        ),
        signalMap
      )
    },
    registerRelays(relayMaps: RelayMap | RelayMap[]) {
      enforceArray(relayMaps).reduce((relayMapOut: RelayMap, relayMapIn: RelayMap) =>
          Object.entries(relayMapIn).reduce((acc, [key, value]: [string, Relay]) => {
            if(acc.key) throw new Error(`Multiple Relays have been applied to the key ${key}`)
            acc[key] = value
            return acc
          },
          relayMapOut
        ),
        relayMap 
      ) 
    },
    model,
    signalMap,
    relayMap
  }
}
 
const enforceArray = (item: any) => Array.isArray(item) ? item : [item]
