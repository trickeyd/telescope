import { Schema, parseSchemaNode } from "../model/schema-model/schema";
import { SchemaNode } from "../model/schema-model/types";
import { validateValueBySchemaNode } from "../model/schema-model/validation";
import { stringify } from "../utils/strings";

export type SignalLoad<T> = { signal: string, payload: T } 

export interface Signal<T = undefined>  {
  add: (listener: (signal: SignalLoad<T>) => void) => void
  dispatch: (payload?: T) => void
}

export const Signal = <T extends any = undefined>(signal: string, schemaNode?: SchemaNode): Signal<T> => {
  const parsedSchemaNode = schemaNode ? parseSchemaNode('root', schemaNode) : undefined
  const listeners: Function[] = []

  return {
    add: listener => listeners.push(listener),
    dispatch: payload => {
      const { isValid, validationMap } = parsedSchemaNode 
        ? validateValueBySchemaNode(payload, parsedSchemaNode)
        : { isValid : true, validationMap: {} } 

      if(!isValid)
        throw Error(`Signal ${signal} has invalid payload\n${stringify(validationMap)}`) 

      listeners.forEach(listener => listener({ signal, payload }))
    }
  }
}
