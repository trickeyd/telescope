type DataMap = Map<string, any>

export interface Data {
  flow: DataMap
  scope: DataMap
  signal: string
  payload: any
}

export const createDataObject = ({ signal, payload, scope, flow }:Data): Data => {
  const scopeData: DataMap = new Map(scope) 

  return {
    get signal() { return signal },
    get payload() { return payload },
    get scope() { return scopeData },
    get flow() { return flow }
  }
}

