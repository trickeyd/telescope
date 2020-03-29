import { Signal } from "../signals/signal"
import { Scope, createScope, ScopeFunction, InternalScope, createStandardInterface } from "../core/core"
import { createDataObject } from "../core/data-object";
import { App, createAppObject } from "../core/app-object";
import { Debug, createDebugObject } from "../debug/debug-object";
import { Schema } from "../model/schema-model/schema";
import { createModelFromSchema } from "../model/schema-model/model";

type SignalMap = { [key: string]: Signal<unknown> }
type SignalConfig = { trigger: string, signal: Signal<unknown> } 
type SignalConfigMap = { [key: string]: SignalConfig }
export type SignalGroupFetcher = (signals: SignalConfigMap) => SignalConfig | SignalConfig[]
export type SignalFetcher = (signals: SignalConfigMap) => SignalConfig

export interface Telescope {
  on: (signalFetcher: SignalGroupFetcher, scopeFunction: ScopeFunction) => void
  model: any
  signalConfigMap: SignalConfigMap
}

export const createTelescope = (schemas: Schema[], signalMaps: SignalMap[]): Telescope => {
  const model: any = schemas.reduce((acc, cur) => {
    acc.set(cur.name, createModelFromSchema(cur.name,  cur))
    return acc
  }, new Map())

  const signalConfigMap = signalMaps.reduce((signalConfigMap: SignalConfigMap, signalMap: SignalMap) =>
    Object.entries(signalMap).reduce(
      (acc: SignalConfigMap, [key, value]: [string, Signal<unknown>]) => {
        if(acc.key) throw new Error(`Multiple Signals have been applied to the key ${key}`)
        return { ...acc, [key]: { trigger: key, signal: value }}
      },
      signalConfigMap
    ),
    {}
  )
  
  let numberOfJobs: number = 0;

  const runScope = (trigger: string, scopeFunction: ScopeFunction) => async (payload: unknown) => {
    payload = payload || {};

    const START_DEPTH = 0;
    
    const debug: Debug = createDebugObject(`j:$${numberOfJobs++}`, START_DEPTH)
    const data = createDataObject({ trigger, payload, scope: new Map(), flow: new Map()})
    const app = createAppObject(model, {}, debug)
       
    const scope: InternalScope = createScope(START_DEPTH);

    app.log("EMITTED  |-------------->  " + trigger);
    app.log("with payload  |---------->  ", payload);

    scopeFunction(createStandardInterface(scope)) 

    await scope.exec(data, app)

    app.log('COMPLETE |<--------------  ' + trigger);
  }
  
  return {
    on: (signalFetcher: SignalGroupFetcher, scopeFunction: ScopeFunction): void => {
      const signalConfigs = enforceArray(signalFetcher(signalConfigMap))
      signalConfigs.forEach(config => config.signal.add(runScope(config.trigger, scopeFunction)))
    },
    model,
    signalConfigMap
  }
}

const enforceArray = (item: any) => Array.isArray(item) ? item : [item]

