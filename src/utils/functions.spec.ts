import { createNamedFunction } from "./functions"
import { Data, createDataObject } from "../core/data-object"
import { App, createAppObject } from "../core/app-object"
import { createDebugObject } from "../debug/debug-object"

describe('utils/functions', () => {
  const FUNC_NAME = 'thisIsMyFunc'
  const data = createDataObject({ payload: { thing: 'thing' }, trigger: 'SOME_EVENT', scope: new Map(), flow: new Map() })
  const app = createAppObject({}, {}, createDebugObject('test', 1), {})
  const next = () => {}
   
  describe('when naming a function', () => {
    it('should be given the appropriate name', () => {
      const myFunc = createNamedFunction(FUNC_NAME, (data: Data, app: App) => {})
      expect(myFunc.name).toBe(FUNC_NAME)
    })

    it('should give be given the appropriate number of arguments', () => {
      const myFunc = createNamedFunction(FUNC_NAME, (data: Data, app: App) => {})
      expect(myFunc.length).toBe(2)
      const myFunc2 = createNamedFunction(FUNC_NAME, (data: Data, app: App, next: Function) => {})
      expect(myFunc2.length).toBe(3) 
    })

    it('should call with the passed arguments', () => {
      const jestFn = jest.fn((data: Data, app: App) => {}) 
      const myFunc = createNamedFunction(FUNC_NAME, jestFn)
      myFunc(data, app) 
      expect(jestFn).toBeCalledWith(data, app)
    })
  })

})
