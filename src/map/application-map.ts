import { Signal, SignalLoad } from "../signals/signal"
import { Scope, createScope, ScopeFunction, InternalScope, createStandardInterface } from "../core/core"
import { createDataObject } from "../core/data-object";
import { App, createAppObject } from "../core/app-object";
import { Debug, createDebugObject } from "../debug/debug-object";
import { Schema } from "../model/schema-model/schema";
import { createModelFromSchema } from "../model/schema-model/model";


export const createApp = (schemas: Schema[]) => {
  const model: any = schemas.reduce((acc, cur) => {
    acc.set(cur.name, createModelFromSchema(cur.name,  cur))
    return acc
  }, new Map())
  
  let numberOfJobs: number = 0;

  const runScope = (scopeFunction: ScopeFunction) => async ({ signal, payload }: SignalLoad<unknown>) => {
    payload = payload || {};

    const START_DEPTH = 0;
    
    const debug: Debug = createDebugObject(`j:$${numberOfJobs++}`, START_DEPTH)
    const data = createDataObject({ signal, payload, scope: new Map(), flow: new Map()})
    const app = createAppObject(model, {}, debug)
       
    const scope: InternalScope = createScope(START_DEPTH);

    app.log("EMITTED  |-------------->  " + signal);
    app.log("with payload  |---------->  ", payload);

    scopeFunction(createStandardInterface(scope)) 

    await scope.exec(data, app)

    app.log('COMPLETE |<--------------  ' + event);
  }
  
  return {
    on: (signal: Signal<unknown> | Signal<unknown>[], scopeFunction: ScopeFunction): void => {
      const signals = Array.isArray(signal) ? signal : [signal]
      signals.forEach(sig => sig.add(runScope(scopeFunction)))
    } 
  }
}


