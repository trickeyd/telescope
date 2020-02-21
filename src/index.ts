export { Provider } from './react/context'
export { Schema, Num, Str, Obj, Arr, Any, Bool } from './model/schema-model'

import { createModelFromSchema, Schema } from './model/schema-model'
import { SchemaNode } from './model/schema-model/types'

export const createReplanApp = (schemas: Schema[]) => {

  const model: any = schemas.reduce((acc, cur) => ({ ...acc, [cur.name]: cur }), {})

  const app = {
    get model() { return model }
  }

}

