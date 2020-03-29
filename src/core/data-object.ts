type DataMap = Map<string, any>

export interface Data {
  flow: DataMap
  scope: DataMap
  trigger: string
  payload: any
}

export const createDataObject = ({ trigger, payload, scope, flow }:Data): Data => {
  const scopeData: DataMap = new Map(scope) 

  return {
    get trigger() { return trigger },
    get payload() { return payload },
    get scope() { return scopeData },
    get flow() { return flow }
  }
}
