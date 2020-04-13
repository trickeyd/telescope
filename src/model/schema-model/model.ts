import lodashGet from 'lodash.get'
import lodashSet from 'lodash.set'
import has from 'lodash.has' 
import { Schema } from "./schema";
import { validateValueBySchemaNode } from "./validation";
import { stringify } from "../../utils/strings";
import { clone } from "./store-cloner";

export interface Model {
  getProp: (path: string) => any
  setProp: (path: string, value: any) => void
  set: (value: any) => void
  listenToProperty: (path: string, callback: (value: any) => void) => void
  unlistenToProperty: (path: string, callback: (value: any) => void) => void
}

  export const createModelFromSchema = (name: string, schema: Schema): Model => {
  let store = Object.create(null)
  let setHasBeenCalled = false
  
  const getProp = (path: string): any => {
    const descriptor = schema.get(path)
    const value = lodashGet(store, path)
    return clone(value, descriptor);
  }

  const setProp = (path: string, value: any) => {
    const descriptor = schema.get(path)
    const validate = descriptor.validate
       
    if(!validate(value).isValid)
      throw Error(`Model '${name}' failed validation of property '${path}' with value '${value}'.`)

    lodashSet(store, path, value) 
    descriptor.updated.emit(value)

    if(!setHasBeenCalled) {
      const { isValid, validationMap } = validateValueBySchemaNode(store, schema.root)

      if(!isValid)
        throw new Error(`Model validation failed:\n${stringify(validationMap)}`)
    }
  } 

  const set = (value: any) => {
    setHasBeenCalled = true

    const { isValid, validationMap } = validateValueBySchemaNode(value, schema.root)

    if(!isValid)
      throw Error(`Model "${name}" failed validation\n${stringify(validationMap)}`)

    store = value
  }

  const listenToProperty = (path: string, callback: (value: any) => void) => {
    schema.get(path).updated.add(callback)
  }

  const unlistenToProperty = (path: string, callback: (value: any) => void) => {
    schema.get(path).updated.add(callback)
  } 

  return {
    getProp,
    setProp,
    set,
    listenToProperty,
    unlistenToProperty
  }
}
