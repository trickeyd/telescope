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

type FlowFunction = CallableFunction | Middleware | ScopeFunction

export type Guard = (data: Data, app: App) => boolean

interface Executable {
  exec: (data: Data, app: App) => Promise<any> 
}

export interface InternalScope extends Executable {
  addExec: (exec: Executable) => void
  readonly depth: number
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
}

type NonEmptyArray<T> = {
    0: T
} & Array<T> 

// using Scope type publicly, as it makes more sense from a user perspective.
export type Scope = StandardInterface
 



/*------------------------------------------
 * Body
 ------------------------------------------------------------------------------*/  
export const createScope = (depth: number = 0): InternalScope => {
  const executables: Executable[] = []
  return {
    addExec: (exec: Executable) => executables.push(exec),
    exec: async (data: Data, app: App) => {
      for (const executable of executables){
        const debug = createDebugObject(app.debug.jobId, depth, app.debug.stack) 
        await executable.exec(
          createDataObject(data),
          createAppObject(app.model, app.service, debug, app.relays)
        )
      }
    },
    get depth() { return depth }
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
      const conditionalCases: ConditionalBlock[] = [{ guards, flowFunctions }]

      scope.addExec({
        exec: async (data, app) => {
          for(const conditional of conditionalCases){
            const { guards, flowFunctions } = conditional
            if(guards.every(guard => guard(data, app))) {
              // TODO - make new objects for the scope
              const flow = Flow(createScope(scope.depth + 1))(flowFunctions)
              await flow.exec(data, app) 
              break
            }
          }
        }
      })
      return createIfInterface(scope, conditionalCases)
    }

const addCondition = (scope: InternalScope, conditionalCases: ConditionalBlock[]) =>
  (...guards: NonEmptyArray<Guard>) => (...flowFunctions: NonEmptyArray<FlowFunction>): IfInterface => {
    conditionalCases.push({ guards, flowFunctions })
    return createIfInterface(scope, conditionalCases)
  } 

const addElseCase = (scope: InternalScope, conditionalCases: ConditionalBlock[]) =>
  (...flowFunctions: NonEmptyArray<FlowFunction>): StandardInterface => {
    conditionalCases.push({ guards: [ (data: Data, app: App) => true ], flowFunctions })
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
      for(const flowFunction of flowFunctions) {
        const numArgs = flowFunction.length
         
        if (numArgs === 1) {
            const newScope: InternalScope = createScope(scope.depth + 1)
            const standardInterface: StandardInterface = createStandardInterface(newScope); 
            (flowFunction as ScopeFunction)(standardInterface)
            app.log(`Scope: ${flowFunction.name || 'unnamed' } -> (`)
            await newScope.exec(data, app)
            app.log(')')

        } else if (numArgs === 2 || numArgs === 3) {
          app.log(`Middleware: ${flowFunction.name || 'unnamed'} ->`)
          const debug = createDebugObject(app.debug.jobId, scope.depth + 1, app.debug.stack) 
          const newApp = createAppObject(app.model, app.service, debug, app.relays); 
          try { 
            await executeMiddleware((flowFunction as Middleware | CallbackMiddleware), data, app)
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
