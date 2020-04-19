import { Middleware, CallbackMiddleware } from "../core/core"
import { App } from "../core/app-object"
import { Data } from "../core/data-object"
import { executeMiddleware } from "../utils/functions";

export const withApp = (getApp: (app: App) => any, hoMiddleware: (param: any) => Middleware | CallbackMiddleware): Middleware => {
  const name = `withApp(${hoMiddleware.name || "unknown"})` 
  const parentObject = {
    [name]: async (data: Data, app: App) => {
      await executeMiddleware(hoMiddleware(getApp(app)), data, app) 
    }
  }
  return parentObject[name]
}
