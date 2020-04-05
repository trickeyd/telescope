import { createAppObject } from "./app-object";
import {
  createStandardInterface,
  createScope,
  InternalScope,
  Do,
  If,
  createDo,
  createIf,
  Middleware,
  Guard,
  StandardInterface,
  IfInterface,
  Scope
} from './core'
import { Data, createDataObject } from "./data-object";
import { App } from "./app-object";
import { createDebugObject } from "../debug/debug-object";

describe('core', () => {
  let scope: InternalScope
  let middleware: Middleware
  let trueGuard: Guard
  let data: Data
  let app: App

  beforeEach(() => { 
    scope = createScope(0)
    middleware = jest.fn((data: Data, app: App) => {})
    trueGuard = jest.fn((data: Data, app: App) => true)
    data = createDataObject({ payload: { thing: 'thing' }, trigger: 'SOME_EVENT', scope: new Map(), flow: new Map() })
    app = createAppObject({}, {}, createDebugObject('test', 1), {})
  })
 
  describe('when using do wrapped scope', () => {
    let doWrap: Do 
    let doReturn: StandardInterface   

    beforeEach(() => { 
      doWrap = createDo(scope)
      doReturn = doWrap(middleware)
    })

    it('returns a StandardInterface', () => {
      expect(doReturn).toHaveProperty('do')
      expect(doReturn).toHaveProperty('if')
      expect(doReturn).not.toHaveProperty('else') 
      expect(doReturn).not.toHaveProperty('elseif') 
    })

    it('can be called with middleware', () => {
      expect(() => {
        doReturn(middleware)
      }).not.toThrow()
    })

  })

  describe('when using if wrapped scope', () => {
    let ifWrap: If 
    let ifReturn: IfInterface

    beforeEach(() => { 
      ifWrap = createIf(scope)
      ifReturn = ifWrap(trueGuard)(middleware) 
    })

    it('return if api', () => {
      expect(ifReturn).toHaveProperty('do')
      expect(ifReturn).toHaveProperty('if')
      expect(ifReturn).toHaveProperty('else') 
      expect(ifReturn).toHaveProperty('elseif') 
    })

    it(`can be called with (guard)(middleware)`, () => {
      expect(() => {
        ifReturn(trueGuard)(middleware)
      }).not.toThrow()
    })
  })

  describe('when a config is executed', () => {
    let middlewareNotToBeCalled

    describe('when an if block is executed', () => {
      let ifGuard: Guard
      let ifGuardResult: boolean
      let elseIfGuard: Guard
      let elseGuardResult: boolean
      let ifMiddleware: Middleware
      let elseIfMiddleware: Middleware
      let elseMiddleware: Middleware
      let executionCompleteMiddleware: Middleware

      beforeEach( () => {
        ifGuard = jest.fn((data: Data, app: App) => ifGuardResult)
        elseIfGuard = jest.fn((data: Data, app: App) => elseGuardResult) 
        ifMiddleware = jest.fn((data: Data, app: App) => undefined) 
        elseIfMiddleware = jest.fn((data: Data, app: App) => undefined) 
        elseMiddleware = jest.fn((data: Data, app: App) => undefined) 
        executionCompleteMiddleware = jest.fn((data: Data, app: App) => undefined) 

        createDo(scope)(
          middleware,
        ).if(ifGuard)(
          ifMiddleware,
        ).elseif(elseIfGuard)(
          elseIfMiddleware
        ).else(
          elseMiddleware
        )(
          middleware
        )
      })

      describe('when if is true and else is true', () => {
        beforeEach(async () => {
          ifGuardResult = true
          elseGuardResult = true
          await scope.exec(data, app) 
        })

        it('should call middleware before and after block', () => {
          expect(middleware).toBeCalledTimes(2)
        })

        it('should call the if guard', () => {
          expect(ifGuard).toHaveBeenCalled()
        }) 

         it('should call the if conditional middleware', () => {
          expect(ifMiddleware).toHaveBeenCalled() 
        })

         it('should not call the else if guard', () => {
          expect(elseIfGuard).not.toHaveBeenCalled()
        })  

        it('should not call the elseif conditional middleware', () => {
          expect(elseIfMiddleware).not.toHaveBeenCalled()
        })

        it('should not call the else middleware', () => {
          expect(elseMiddleware).not.toHaveBeenCalled()
        })
      })

      describe('when if is false and else is true', () => {
        beforeEach(async () => {
          ifGuardResult = false
          elseGuardResult = true
          await scope.exec(data, app) 
        })

        it('should call middleware before and after block', () => {
          expect(middleware).toBeCalledTimes(2)
        })

        it('should call the if guard', () => {
          expect(ifGuard).toHaveBeenCalled()
        }) 

         it('should not call the if conditional middleware', () => {
          expect(ifMiddleware).not.toHaveBeenCalled() 
        })
 
         it('should call the else if guard', () => {
          expect(elseIfGuard).toHaveBeenCalled()
        })  

        it('should call the elseif conditional middleware', () => {
          expect(elseIfMiddleware).toHaveBeenCalled()
        })

        it('should not call the else middleware', () => {
          expect(elseMiddleware).not.toHaveBeenCalled()
        })
      })

      describe('when if is false and else is false', () => {
        beforeEach(async () => {
          ifGuardResult = false
          elseGuardResult = false
          await scope.exec(data, app) 
        })

        it('should call middleware before and after block', () => {
          expect(middleware).toBeCalledTimes(2)
        })

        it('should call the if guard', () => {
          expect(ifGuard).toHaveBeenCalled()
        }) 

         it('should not call the if conditional middleware', () => {
          expect(ifMiddleware).not.toHaveBeenCalled() 
        })
 
        it('should call the else if guard', () => {
          expect(elseIfGuard).toHaveBeenCalled()
        })  

        it('should not call the elseif conditional middleware', () => {
          expect(elseIfMiddleware).not.toHaveBeenCalled()
        })

        it('should call the else middleware', () => {
          expect(elseMiddleware).toHaveBeenCalled()
        })
      }) 
    })

    describe('when dealing with embedded scopes', () => {
      const numberUpdater = (id: number) => (data: Data, app: App) => ids.push(id)
      const numberUpdaterWithDelay = (id: number) => (data: Data, app: App, next: Function) => setTimeout(() => {
          ids.push(id)
          next()
        }, 20)
      const mockScope = jest.fn((scope: Scope) => scope(
        numberUpdaterWithDelay(3),
        numberUpdater(4)
      ))
      const paramPusher = (data: Data, app: App) => params.push(data.payload.thing)
      const scopeDataAdder = (name: string) => (data: Data, app: App) => data.scope.set(name, true)
      const scopeDataExistsPusher = (name: string) => (data: Data, app: App) => scopeDataExist.push(!!data.scope.get(name))
      const flowDataAdder = (name: string) => (data: Data, app: App) => data.flow.set(name, true)
      const flowDataExistsPusher = (name: string) => (data: Data, app: App) => flowDataExist.push(!!data.flow.get(name))
 
      let ids: number[]
      let params: string[]
      let scopeDataExist: boolean[]
      let flowDataExist: boolean[]

      beforeEach(async () => {
        ids = []
        params = []
        scopeDataExist = []
        flowDataExist = []

        createDo(scope)(
          numberUpdater(1),
          scopeDataAdder('level_1'),
          flowDataAdder('level_1'),
          (scope: Scope) => scope(
            numberUpdaterWithDelay(2),
            scopeDataAdder('level_2'),
            flowDataAdder('level_2'),
            mockScope,
            paramPusher,
            numberUpdater(5),
            scopeDataExistsPusher('level_1'),
            scopeDataExistsPusher('level_2'),
            flowDataExistsPusher('level_1'),
            flowDataExistsPusher('level_2'),
          ),
          paramPusher,
          numberUpdater(6),
          scopeDataExistsPusher('level_1'),
          scopeDataExistsPusher('level_2'),
          flowDataExistsPusher('level_1'),
          flowDataExistsPusher('level_2'),
        )
 
        await scope.exec(data, app)
      })

      it('should call all middlewares in the correct order regardless of delay', () => {
        expect(ids).toEqual([1,2,3,4,5,6])
      })

      it('should call the scope that was written separately', () => {
         expect(mockScope).toHaveBeenCalled() 
      })

      it('should be able to access initial params at any level of scope', () => {
        expect(params).toEqual(['thing', 'thing'])
      })

      it('should only allow access to scoped data in this or parent scopes', () => {
        expect(scopeDataExist).toEqual([true, true, true, false])
      }) 

      it('should allow access to flow data once set, regardless of scope', () => {
        expect(flowDataExist).toEqual([true, true, true, true])
      }) 

    })

    describe('when using scope function and its interface', () => {
      beforeEach(async () => {
        createStandardInterface(scope).do(
          middleware,
          (scope: Scope) => scope.if(() => false)(
            middleware
          ),
          (scope: Scope) => scope.if(() => true)(
            middleware,
            (scope: Scope) => scope.do(
              middleware,
              (scope: Scope) => scope(
                middleware
              )
            )
          )
        ) 

        await scope.exec(data, app)
      })

      it('should work consistently', () => {
        expect(middleware).toHaveBeenCalledTimes(4)
      })
    })
  })
})
