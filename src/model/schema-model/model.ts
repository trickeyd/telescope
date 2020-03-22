import lodashGet from 'lodash.get'
import lodashSet from 'lodash.set'
import has from 'lodash.has' 
import { Schema } from "./schema";
import { validateValueBySchemaNode } from "./validation";
import { stringify } from "../../utils/strings";

export const createModelFromSchema = (name: string, schema: Schema) => {
  let store = Object.create(null)
  let setHasBeenCalled = false
  
  const getProp = (path: string) => {
    return lodashGet(store, path)
  }

  const setProp = (path: string, value: any) => {
    const validate = schema.get(path).validate
       
    if(!validate(value).isValid)
      throw Error(`Model '${name}' failed validation of property '${path}' with value '${value}'.`)

    lodashSet(store, path, value) 

    if(!setHasBeenCalled) {
      const { isValid, validationMap } = validateValueBySchemaNode(store, schema.root)

      if(!isValid)
        throw new Error(`Model validation failed:\n${stringify(validationMap)}`)
    }
    console.log('store', store)

  } 

  const set = (value: any) => {
    setHasBeenCalled = true

    const { isValid, validationMap } = validateValueBySchemaNode(value, schema.root)

    if(!isValid)
      throw Error(`Model "${name}" failed validation\n${stringify(validationMap)}`)

    store = value
  }

  return {
    getProp,
    setProp,
    set
  }
}
