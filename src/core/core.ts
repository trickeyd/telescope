import { App, createAppObject } from './app-object'
import { Data, createDataObject } from './data-object'
import { createDebugObject } from "../debug/debug-object";
import { executeMiddleware } from "../utils/functions";

/*------------------------------------------
 * Types
 ------------------------------------------------------------------------------*/  
export type ScopeFunction = (scope: Scope) => void 
export type Middleware = (data: Data, app: App) => Promise<any> | void 
export type CallbackMiddleware = (data: Data, app: App, next: Function) => void 

type FlowFunction = CallableFunction | Middleware | ScopeFunction | null

export type Guard = (data: Data, app: App) => boolean | Promise<boolean>

interface Executable {
  exec: (data: Data, app: App) => Promise<any> 
}

export interface InternalScope extends Executable {
  addExec: (exec: Executable) => void
}

export type Do = (...flowFunctions: NonEmptyArray<FlowFunction>) => StandardInterface 
export type If = (...guards:NonEmptyArray<Guard>) => (...flowFunctions: NonEmptyArray<FlowFunction>) => IfInterface
type ElseIf = (...guards: NonEmptyArray<Guard>) => (...flowFunctions: NonEmptyArray<FlowFunction>) => IfInterface
type Else = (...flowFunctions: NonEmptyArray<FlowFunction>) => StandardInterface
 
export interface StandardInterface {
  (...flowFunctions: NonEmptyArray<FlowFunction>): StandardInterface 
  readonly do: Do
  readonly if: If
}

export interface IfInterface {
  (...guards: NonEmptyArray<Guard>): (...flowFunctions: NonEmptyArray<FlowFunction>) => IfInterface 
  readonly do: Do
  readonly if: If
  readonly elseif: ElseIf
  readonly else: Else
}

interface ConditionalBlock {
  guards: NonEmptyArray<Guard>
  flowFunctions: NonEmptyArray<FlowFunction>
  type: string
}

type NonEmptyArray<T> = {
    0: T
} & Array<T> 

// using Scope and IScope types publicly, as it makes more sense from a user perspective.
export type Scope = ScopeFunction
export type IScope = StandardInterface
 



/*------------------------------------------
 * Body
 ------------------------------------------------------------------------------*/  
export const createScope = (): InternalScope => {
  const executables: Executable[] = []
  return {
    addExec: (exec: Executable) => executables.push(exec),
    exec: async (data: Data, app: App) => {
      for (const executable of executables){
        const debug = createDebugObject(app.debug.jobId, app.debug.depth, app.debug.stack) 
        await executable.exec(
          createDataObject(data),
          createAppObject(app.model, app.service, debug, app.relays)
        )
      }
    },
  }
}

export const createDo = (scope: InternalScope): Do =>
  (...flowFunctions:  NonEmptyArray<FlowFunction>): StandardInterface => {
    scope.addExec(Flow(scope)(flowFunctions))
    return createStandardInterface(scope)
  } 

export const createIf = (scope: InternalScope): If =>
  (...guards: NonEmptyArray<Guard>) =>
    (...flowFunctions: NonEmptyArray<FlowFunction>): IfInterface => {
      const conditionalCases: ConditionalBlock[] = [{ guards, flowFunctions, type: 'if' }]

      scope.addExec({
        exec: async (data, app) => {
          for(const conditional of conditionalCases){
            const { guards, flowFunctions, type } = conditional
            let pass = true
            let logString = `${type}(`
            for(const guard of guards) {
              const currentPass = await guard(data, app) 
              logString += `${guard.name || 'unknown'} ${currentPass ? '√' : 'X'}` 
              if(!currentPass){
                pass = false
              }
            }
            logString += `) ${pass ? '√ (' : 'X'}`
            app.log(logString)
            if(pass) {
              // TODO - make new objects for the scope
              const debug = createDebugObject(app.debug.jobId, app.debug.depth + 1, app.debug.stack) 
              const newApp = createAppObject(app.model, app.service, debug, app.relays);  
              const flow = Flow(createScope())(flowFunctions)
              await flow.exec(data, newApp) 
              app.log(')')
              break
            }
          }
        }
      })
      return createIfInterface(scope, conditionalCases)
    }

const addCondition = (scope: InternalScope, conditionalCases: ConditionalBlock[]) =>
  (...guards: NonEmptyArray<Guard>) => (...flowFunctions: NonEmptyArray<FlowFunction>): IfInterface => {
    conditionalCases.push({ guards, flowFunctions, type: 'elseif' })
    return createIfInterface(scope, conditionalCases)
  } 

const addElseCase = (scope: InternalScope, conditionalCases: ConditionalBlock[]) =>
  (...flowFunctions: NonEmptyArray<FlowFunction>): StandardInterface => {
    conditionalCases.push({ guards: [ (data: Data, app: App) => true ], flowFunctions, type: 'else' })
    return createStandardInterface(scope)
  }  

export const createStandardInterface = (scope: InternalScope): StandardInterface =>
  Object.assign(
    createDo(scope),
    { 
      get do() { return createDo(scope) },
      get if() { return createIf(scope) },
    }
  )

const createIfInterface = (scope: InternalScope, conditionalBlocks: ConditionalBlock[]): IfInterface =>
  Object.assign(
    createIf(scope),
    { 
      get do() { return createDo(scope) },
      get if() { return createIf(scope) },
      get elseif() { return addCondition(scope, conditionalBlocks) },
      get else() { return addElseCase(scope, conditionalBlocks) }
    }
  )

const Flow = (scope: InternalScope) => (flowFunctions: NonEmptyArray<FlowFunction>): Executable => {
  return {
    exec: async (data: Data, app: App) => {
      const debug = createDebugObject(app.debug.jobId, app.debug.depth + 1, app.debug.stack) 
      const newApp = createAppObject(app.model, app.service, debug, app.relays); 
       
      for(const flowFunction of flowFunctions) {
        if(flowFunction === null) continue;

        const numArgs = flowFunction.length

        if (numArgs === 1) {
          const newScope: InternalScope = createScope()
          const standardInterface: StandardInterface = createStandardInterface(newScope); 
          (flowFunction as ScopeFunction)(standardInterface)
          app.log(`Scope: ${flowFunction.name || 'unnamed' } --> (`)
          await newScope.exec(data, newApp)
          app.log(')')

        } else if (numArgs === 2 || numArgs === 3) {
          app.log(`Middleware: ${flowFunction.name || 'unnamed'} =>`)
          try { 
            await executeMiddleware((flowFunction as Middleware | CallbackMiddleware), data, newApp)
          } catch(err) {
            app.log(err)
          }
        } else {
          throw new Error('Telescope middleware must accept 2/3 arguments, and scopes accept 1')
        }
      }
    }
  }
}
