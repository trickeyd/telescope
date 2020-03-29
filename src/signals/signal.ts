import { Schema, parseSchemaNode } from "../model/schema-model/schema";
import { SchemaNode } from "../model/schema-model/types";
import { validateValueBySchemaNode } from "../model/schema-model/validation";
import { stringify } from "../utils/strings";

export interface Signal<T = undefined>  {
  add: (listener: (payload: T) => void) => void
  dispatch: (payload?: T) => void
}

export const Signal = <T extends any = undefined>(schemaNode?: SchemaNode): Signal<T> => {
  const parsedSchemaNode = schemaNode ? parseSchemaNode('signal', schemaNode) : undefined
  const listeners: Function[] = []

  return {
    add: listener => listeners.push(listener),
    dispatch: payload => {
      const { isValid, validationMap } = parsedSchemaNode 
        ? validateValueBySchemaNode(payload, parsedSchemaNode)
        : { isValid : true, validationMap: {} } 

      if(!isValid)
        throw Error(`Signal has invalid payload\n${stringify(validationMap)}`) 

      listeners.forEach(listener => listener(payload))
    }
  }
}
