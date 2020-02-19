import lodashGet from 'lodash.get'
import lodashSet from 'lodash.set'
import has from 'lodash.has' 
import { Schema } from "./schema";
import { validateStoreNodeDescriptor } from "./validation";

export const createModelFromSchema = (name: string, schema: Schema) => {
  let store = Object.create(null)
  let setHasBeenCalled = false
  
  const getProp = (path: string) => {
    lodashGet(store, path)
  }

  const setProp = (path: string, value: any) => {
    const validate = schema.get(path).validate
       
    if(!validate(value).isValid)
      throw Error(`Model '${name}' failed validation of property '${path}' with value '${value}'.`)

    lodashSet(store, path, value) 

    if(!setHasBeenCalled) {
      const { isValid, validationMap } = validateStoreNodeDescriptor(store, schema.root)

      if(!isValid)
        throw new Error(`Model validation failed:\n${JSON.stringify(validationMap, null, 2)}`)
    }

  } 

  const set = (value: any) => {
    setHasBeenCalled = true

    const { isValid, validationMap } = validateStoreNodeDescriptor(value, schema.root)

    if(!isValid)
      throw Error(`Model "${name}" failed validation\n${JSON.stringify(validationMap, null, 2)}`)

    store = value
  }

  return {
    getProp,
    setProp,
    set
  }
}
