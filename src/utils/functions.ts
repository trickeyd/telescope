import { CallbackMiddleware, Middleware } from "../core/core";
import { App } from "../core/app-object";
import { Data } from "../core/data-object";

export const executeMiddleware = async (middleware: Middleware | CallbackMiddleware, data: Data, app: App): Promise<void> => {
  if(middleware.length === 3)
    await new Promise(resolve => (middleware as CallbackMiddleware)(data, app, resolve))
  else
    await (middleware as Middleware)(data, app)
}
