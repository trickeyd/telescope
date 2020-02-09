type DataMap = Map<string, any>

export interface Data {
  flow: DataMap
  scope: DataMap
  params: any
  event: string
}

export const createDataObject = ({ params, event, scope, flow }: Data): Data => {
  const scopeData: DataMap = new Map(scope) 
  return {
    get event() { return event },
    get params() { return params },
    get scope() { return scopeData },
    get flow() { return flow }
  }
}

