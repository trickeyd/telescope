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

describe('core', () => {
  let scope: InternalScope
  let middleware: Middleware
  let trueGuard: Guard

  beforeEach(() => { 
    scope = createScope('event')
    middleware = jest.fn((data: any, app: any) => {})
    trueGuard = jest.fn((data: any, app: any) => true)
  })
 
  describe('do wrapped scope', () => {
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

  describe('if wrapped scope', () => {
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
        ifGuard = jest.fn((data: any, app: any) => ifGuardResult)
        elseIfGuard = jest.fn((data: any, app: any) => elseGuardResult) 
        ifMiddleware = jest.fn((data: any, app: any) => undefined) 
        elseIfMiddleware = jest.fn((data: any, app: any) => undefined) 
        elseMiddleware = jest.fn((data: any, app: any) => undefined) 
        executionCompleteMiddleware = jest.fn((data: any, app: any) => undefined) 

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
          await scope.exec({}, {}) 
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
          await scope.exec({}, {}) 
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
          await scope.exec({}, {}) 
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
      const numberUpdater = (id: number) => (data: any, app: any) => ids.push(id)
      const numberUpdaterWithDelay = (id: number) => (data: any, app: any, next: any) => setTimeout(() => {
          ids.push(id)
          next()
        }, 20)
      const mockScope = jest.fn((scope: Scope) => scope(
        numberUpdaterWithDelay(3),
        numberUpdater(4)
      ))
 
      let ids: number[]

      beforeEach(async () => {
        ids = []
        createDo(scope)(
          numberUpdater(1),
          (scope: Scope) => scope(
            numberUpdaterWithDelay(2),
            mockScope,
            numberUpdater(5)
          ),
          numberUpdater(6)
        )
 
        await scope.exec({}, {})
      })

      it('should call all middlewares in the correct order regardless of delay', () => {
        expect(ids).toEqual([1,2,3,4,5,6])
      })

      it('should call the scope that was written separately', () => {
         expect(mockScope).toHaveBeenCalled() 
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

        await scope.exec({}, {})
      })

      it('should work consistently', () => {
        expect(middleware).toHaveBeenCalledTimes(4)
      })
    })
  })
})
