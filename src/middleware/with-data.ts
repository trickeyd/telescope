import { Middleware } from "../core/core"
import { Data } from "../core/data-object"
import { App } from "../core/app-object";
import { executeMiddleware } from "../utils/functions";

export const withData = (getData: (data: Data) => any, hOMiddleware: (param: any) => Middleware): Middleware => {
  const name = `withData(${hOMiddleware.name || "unknown"})` 
  const parentObject = {
    [name]: async (data: Data, app: App) => {
      await executeMiddleware(hOMiddleware(getData(data)), data, app)
    }
  }
  return parentObject[name]
}
