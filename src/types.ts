export type FlowFunction = (...args: any[]) => Promise<any> | void


export type Middleware = (data: any, app: any, next?: () => void) => void
export interface IMiddlewareRunner = {
  run: Middleware
} 
const sdff =1;

