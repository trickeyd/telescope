export { parseSchemaNode, Num, Str, Obj, Arr } from "./schema"

import { SchemaNode, PropertyDescriptor } from "./types"
import lodashGet from 'lodash.get'
import lodashSet from 'lodash.set'
import has from 'lodash.has' 
import { parseSchemaNode, Num, Str, Obj, Arr, Schema, Any } from "./schema"
import { validateStoreNodeDescriptor } from "./validation"
  

const createModelFromSchema = (name: string, schema: Schema) => {
  console.log('schema', schema)
  let store = Object.create(null)
  let setHasBeenCalled = false
  
  const getProp = (path: string) => {
    lodashGet(store, path)
  }

  const setProp = (path: string, value: any) => {
    const validator = schema.get(path).validator
      console.log('ewrqwerw', validator(value))
       
    if(!validator(value).isValid)
      throw new Error(`Model '${name}' failed validation of property '${path}' with value '${value}'.`)
    
    lodashSet(store, path, value) 

    if(!setHasBeenCalled) {
      const { isValid, validationMap } = validateStoreNodeDescriptor(store, schema.root)

      console.log("iiiissval", isValid, validationMap)
      if(!isValid)
        throw new Error(`Model validation failed:\n${JSON.stringify(validationMap, null, 2)}`)
    }

  } 

  const set = (value: any) => {
    setHasBeenCalled = true
    console.log(JSON.stringify(validateStoreNodeDescriptor(value, schema.root), null, 2)) 
    //if(!validateStore(value, schema))
      //throw new Error(`Model  failed validation of property with value '${value}'.`)
     //

    store = value
  }

  return {
    getProp,
    setProp,
    set
  }
 
}

 

const model = createModelFromSchema(
  'Shitty Model',
  Schema(Obj({
    id: Num(), 
    name: Str().isRequired(),
    anything: Any(),
    ant: Num(),
    props: Obj({
      prop1: Str(),
      prop2: Str(),
      list: Arr({
        id: Num(),
        name: Str()
      }),
      another: Obj({
        one: Str()
      })
    })
  }))
)

model.setProp('anything', { poo: 'sdf' })
/*model.set({
  id: 123,
  name: 'kjlj',
  ant: 12,
  props: {
    prop1: 'ijij',
    prop2: 'fsd',
    prop3:'dfd',
    list: [
      { id: 123, name:'asdf' },
      { id: 234, name:'asdf' }
    ],
    another: {
      one: 'sdf'
    },
  }
})*/

