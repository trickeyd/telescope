import DebugObject from './DebugObject';

interface Data {
  scope: any
  flow: any
  params: any
  event: string
}

export const createDataObject = (params=undefined, event=undefined, isLoggable=false) => ({
    get event() { return event },
    get parmas() { return params },
    get scope() { return scope },
    get flow() { return flow }
})

