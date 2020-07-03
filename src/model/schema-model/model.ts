import isUndefined from 'lodash.isundefined'
import isPlainObject from 'lodash.isplainobject'
import cloneDeep from 'lodash.clonedeep'
import lodashGet from 'lodash.get'
import lodashSet from 'lodash.set'
import has from 'lodash.has' 
import { Schema, Arr, Obj } from "./schema";
import { validateValueByModelNode } from "./validation";
import { stringify } from "../../utils/strings";
import { Signal } from "../../signals/signal";
import { SchemaNode, PropertyDescriptor, PropertyType, SchemaType, SchemaConfig } from "./types";

export interface ModelNode {
  children?: ModelNode[],
  parent?: ModelNode
  updated: Signal,
  descriptor: PropertyDescriptor,
}

export interface Model {
  getProp: (path: string) => any
  setProp: (path: string, value: any) => void
  set: (value: any) => void
  getPropertyUpdated: (path: string) => Signal
} 

 
export const getModelNodeByPath = (modelNode: ModelNode, path: string): ModelNode => {
  if(path.match(/\[.\]/))
    throw new Error("Array items cannot be retrieved individually. Array notation [*] not allowed when getting properties")
   
  const parsedPath: string[] = path.split('.')
  let node: ModelNode = modelNode;
  for(let i = 0, l = parsedPath.length; i < l; i++){
    node = getChildByName(node, parsedPath[i])
    if(!node) throw new Error(`property ${path} does not exist in schema`) 
  }
  return node
}

const getChildByName = (modelNode: ModelNode, name: string): ModelNode => {
  if(modelNode.children) {
    for(let i = 0, l = modelNode.children.length; i < l; i++){
      const child = modelNode.children[i]
      if(child.descriptor.name === name)
        return child
    }
  }

  throw new Error(`SchemaError: Child ${name} not found on ${modelNode.descriptor.name}`)
}

// @ts-ignore - https://github.com/microsoft/TypeScript/issues/37381
const isNumberString = name => parseInt(name) == name

const searchChildren = (storeNode: any, modelNode: ModelNode) => {
  const children = modelNode.children;
  if(!children) return

  for(let i = 0, l = children.length; i < l; i++){
    const child = children[i]
    const name = child.descriptor.name 

    const isUndefined = storeNode === undefined 
    const value = isUndefined ? undefined : storeNode[name]
    child.updated.emit(value)
    searchChildren(value, child)
  }
}
 

// replace literals with schema types
export const parseSchemaNode = (name: string, schemaNode: SchemaNode, parent?: ModelNode): ModelNode => {
  const descriptor = extractDescriptor(name, schemaNode)
 
  const modelNode: ModelNode = {
    updated: Signal(),
    parent,
    descriptor,
  }

  modelNode.children = extractChildren(descriptor, modelNode)
  return modelNode
}

const extractDescriptor = (name: string, schemaNode: SchemaNode): PropertyDescriptor => {
   if(Array.isArray(schemaNode)){
    if(schemaNode.length > 1)
      throw Error('Array shorthand in schema may only have one child')
    return (Arr((schemaNode)[0]))(name) 
  }

  if(isPlainObject(schemaNode))
   return (Obj(schemaNode as SchemaConfig))(name)

  return  (schemaNode as SchemaType)(name)
}

const extractChildren = (descriptor: PropertyDescriptor, modelNode: ModelNode): ModelNode[] | undefined => {
  if(descriptor.type === PropertyType.array)
    return [ parseSchemaNode(`__array`, (descriptor.contentNode as SchemaConfig | SchemaType), modelNode) ] 

  if(descriptor.type === PropertyType.object)
    return Object.entries((descriptor.contentNode as SchemaConfig)).reduce(
      (acc: ModelNode[], [key, value]: [string, SchemaNode]) => {
        acc[acc.length] = parseSchemaNode(key, value, modelNode)
        return acc 
      },
      []
    )

  return undefined
}



export const createModelFromSchema = (name: string, schema: Schema): Model => {
  const model: ModelNode = parseSchemaNode(name, schema.rootSchemaNode)

  let prevStore = Object.create(null)
  let store = Object.create(null)
  let setHasBeenCalled = false
  
  const getProp = (path: string): any => {
    const value = lodashGet(store, path)
    return cloneDeep(value);
  }

  const setProp = (path: string, value: any) => {
    if(path.match(/\[.\]/))
      throw new Error("Array items cannot be set individually. Array notation [*] not allowed when setting properties")
       
    const parsedPath: string[] = path.split('.')

    let modelNode: ModelNode = model
    let storeNode: any = store
 
    // first loop gets us to the prop in question
    for(let i = 0, l = parsedPath.length; i < l; i++){

      const name: string = parsedPath[i]

      modelNode = getChildByName(modelNode, name)

      if(i === l - 1) {
        if(!modelNode.descriptor.validate(value).isValid)
          throw Error(`Model '${name}' failed validation of property '${path}' with value '${value}'.`)
         
        storeNode[name] = value  
      } else{
        if(!storeNode) 
          throw new Error(`Property ${name} is undefined, so its children cannot be set`) 
      }
      storeNode = storeNode[name] 
      modelNode.updated.emit(storeNode) 
    }

    searchChildren(storeNode, modelNode)

    if(!setHasBeenCalled) {
      const { isValid, validationMap } = validateValueByModelNode(store, model)

      if(!isValid)
        throw new Error(`Model validation failed:\n${stringify(validationMap)}`)
    }
  } 

  const set = (value: any) => {
    setHasBeenCalled = true

    const { isValid, validationMap } = validateValueByModelNode(value, model)

    if(!isValid)
      throw Error(`Model "${name}" failed validation\n${stringify(validationMap)}`)

    store = value

    searchChildren(value, model) 
  }

  const getPropertyUpdated = (path: string): Signal => {
    return getModelNodeByPath(model, path).updated 
  }

  return {
    getProp,
    setProp,
    set,
    getPropertyUpdated
  }
}


