import lodashGet from 'lodash.get'
import isString from 'lodash.isstring'
import isNumber from 'lodash.isnumber'
import isBoolean from 'lodash.isboolean'
import isArray from 'lodash.isarray'
import isUndefined from 'lodash.isundefined'
import isPlainObject from 'lodash.isplainobject'
import {
  IBool,
  INum,
  IStr,
  IArr,
  IObj,
  Validator,
  SchemaConfig,
  PropertyType,
  SchemaType,
  PropertyDescriptor,
  SchemaNode
} from "./types";
import { validateAll, isRequired, validate } from "./validation";

export interface Schema {
  get: (path: string) => PropertyDescriptor
  readonly root: PropertyDescriptor
}

export const Any = (): IStr => {
  const validators: Validator[] = [{ validate: (item: any) => isUndefined(item) || isString(item), failMessage: "it's not a string"}]
  const returnObject = (name: string) => ({ name, type: PropertyType.string, validator: validateAll(validators) })
  return Object.assign(
    returnObject,
    {
      isRequired: isRequired(returnObject, validators),
      validate: validate(returnObject, validators) 
    }
  )
}  

export const Str = (): IStr => {
  const validators: Validator[] = [{ validate: (item: any) => isUndefined(item) || isString(item), failMessage: "it's not a string"}]
  const returnObject = (name: string) => ({ name, type: PropertyType.string, validator: validateAll(validators) })
  return Object.assign(
    returnObject,
    {
      isRequired: isRequired(returnObject, validators),
      validate: validate(returnObject, validators) 
    }
  )
} 

export const Num = (): INum => {
  const validators: Validator[] = [{ validate: (item: any) => isUndefined(item) || isNumber(item),  failMessage: "it's not a number" }]
  const returnObject = (name: string) => ({ name, type: PropertyType.number, validator: validateAll(validators) })
  return Object.assign(
    returnObject,
    {
      isRequired: isRequired(returnObject, validators),
      validate: validate(returnObject, validators) 
    }
  )
}

export const Bool = (): IBool => {
  const validators: Validator[] = [{ validate: (item: any) => isUndefined(item) || isBoolean(item), failMessage: "it's not a boolean" }]
  const returnObject = (name: string) => ({ name, type: PropertyType.boolean, validator: validateAll(validators) })
  return Object.assign(
    returnObject,
    {
      isRequired: isRequired(returnObject, validators)
    }
  )
} 

export const Arr = (contentSchema: SchemaConfig): IArr => {
  if(isUndefined(contentSchema))
    throw new Error('The Arr SchemaType function requires a SchemaConfig.')

  const validators: Validator[] = [{ validate: (item: any) => isUndefined(item) || isArray(item), failMessage: "it's not an array" }]
  const returnObject = (name: string) => ({
    name,
    type: PropertyType.array,
    content: parseSchemaObject(contentSchema),
    validator: validateAll(validators)
  })
  return Object.assign(
    returnObject,
    {
      isRequired: isRequired(returnObject, validators),
      validate: validate(returnObject, validators) 
    }
  )
}

export const Obj = (contentSchema: SchemaConfig): IObj => {
  if(isUndefined(contentSchema))
    throw new Error('The Obj SchemaType funciton requires a SchemaConfig.')
   
 const validators: Validator[] = [{ validate: (item: any) => isUndefined(item) || isPlainObject(item), failMessage: "it's not an object"} ]
  const returnObject = (name: string) => ({
    name,
    type: PropertyType.object,
    content: parseSchemaObject(contentSchema),
    validator: validateAll(validators)
  })
  return Object.assign(
    returnObject,
    {
      isRequired: isRequired(returnObject, validators),
      validate: validate(returnObject, validators) 
    }
  ) 
} 

export const parseSchemaNode = (name: string, schemaNode: SchemaNode): PropertyDescriptor => {
  if(isArray(schemaNode)){

    if(schemaNode.length > 1)
      throw new Error('Array shorthand in schema may only have one child')

    return (Arr((schemaNode)[0]))(name) 
  }

  if(isPlainObject(schemaNode))
    return (Obj(schemaNode as SchemaConfig))(name)

  return (schemaNode as SchemaType)(name)
}

const parseSchemaObject = (schemaConfig: SchemaConfig) =>
  Object.entries(schemaConfig).reduce(
    (acc: { [key: string]: PropertyDescriptor}, [key, value]: [string, SchemaType]) => {
      acc[key] = parseSchemaNode(key, value)
      return acc 
    },
    {}
  )  

const getProp = (pathSections: string[], propDescriptor: PropertyDescriptor): PropertyDescriptor => {
  const pathProp = (pathSections.shift() as string).split('[')[0]
  const prop = lodashGet(propDescriptor, 'content.' + pathProp)

  if(!prop)
    throw new Error(`Property ${pathProp} does not exist on ${propDescriptor.name}.`)

  return pathSections.length ? getProp(pathSections, prop) : prop
} 

 
export const Schema = (schemaNode: SchemaNode): Schema => {
  const parsedSchema = parseSchemaNode('root', schemaNode) 

  const get = (path: string): PropertyDescriptor => {
    const pathSections = path.split('.') 
    return getProp(pathSections, parsedSchema)
  }

  return {
    get,
    get root() { return parsedSchema }
  }
}
