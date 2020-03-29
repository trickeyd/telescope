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
  SchemaNode,
  IAny,
  ValidationEnablerMapFactory,
  ValidationEnablerMap,
  SchemaNodeContent,
} from "./types";
import { validateAll, createValidatorAdder, createLengthValidation, createCommonValidation } from "./validation";
import { Signal } from "../../signals/signal";

const createSchemaType = <T extends unknown>(propType: PropertyType, contentSchema?: SchemaConfig, ...validationEnablerFactories: ValidationEnablerMapFactory[]): T => {
  const validators: Validator[] = []
  const updated: Signal<unknown> = Signal(`PROPERTY_UPDATED`)
  const content = contentSchema ? parseSchemaObject(contentSchema, updated) : undefined; 
  const returnObject: SchemaType = (name: string) => ({ name, type: propType, updated, content, validate: validateAll(validators) })
  const validationEnablerMap = validationEnablerFactories.reduce(
    (acc: ValidationEnablerMap<T>, cur: ValidationEnablerMapFactory) => ({ ...acc, ...cur(returnObject as T, validators) }),
    {}
  ) 
  return Object.assign( 
    returnObject,
    {
      ...validationEnablerMap 
    }
  ) as T
}

export const Any = (): IAny => createSchemaType<IAny>(PropertyType.any, undefined, createCommonValidation(), createValidatorAdder())
export const Str = (): IStr => createSchemaType<IStr>(PropertyType.string, undefined, createCommonValidation(isString, PropertyType.string), createValidatorAdder(), createLengthValidation() )
export const Num = (): INum => createSchemaType<INum>(PropertyType.number, undefined, createCommonValidation(isNumber, PropertyType.number), createValidatorAdder())
export const Bool = (): IBool => createSchemaType<IBool>(PropertyType.boolean, undefined, createCommonValidation(isBoolean, PropertyType.boolean))
export const Arr = (contentSchema: SchemaConfig): IArr => {
  if(isUndefined(contentSchema))
    throw Error('The Arr SchemaType function requires a SchemaConfig.')
  return createSchemaType<IArr>(PropertyType.array, contentSchema, createCommonValidation(isArray, PropertyType.array), createValidatorAdder(), createLengthValidation())
}

export const Obj = (contentSchema: SchemaConfig): IObj => {
  if(isUndefined(contentSchema))
    throw Error('The Obj SchemaType function requires a SchemaConfig.')
  
  return createSchemaType<IObj>(PropertyType.object, contentSchema, createCommonValidation(isPlainObject, PropertyType.object), createValidatorAdder())
} 

export const parseSchemaNode = (name: string, schemaNode: SchemaNode): PropertyDescriptor => {
  if(isArray(schemaNode)){

    if(schemaNode.length > 1)
      throw Error('Array shorthand in schema may only have one child')

    return (Arr((schemaNode)[0]))(name) 
  }

  if(isPlainObject(schemaNode))
    return (Obj(schemaNode as SchemaConfig))(name)

  return (schemaNode as SchemaType)(name)
}

// any parent child interaction should be done here
const parseSchemaObject = (schemaConfig: SchemaConfig, updateParent?: Signal<unknown>): SchemaNodeContent =>
  Object.entries(schemaConfig).reduce(
    (acc: { [key: string]: PropertyDescriptor}, [key, value]: [string, SchemaNode]) => {
      const node = acc[key] = parseSchemaNode(key, value)
      updateParent && node.updated.add(updateParent.dispatch)
      return acc 
    },
    {}
  )  

const getProp = (pathSections: string[], propDescriptor: PropertyDescriptor): PropertyDescriptor => {
  const propPath = (pathSections.shift() as string).split('[')[0]
  const prop = lodashGet(propDescriptor, 'content.' + propPath)

  if(!prop) throw Error(`Property "${propPath}" does not exist on "${propDescriptor.name}".`)

  return pathSections.length ? getProp(pathSections, prop) : prop
} 

export interface Schema {
  get: (path: string) => PropertyDescriptor
  readonly root: PropertyDescriptor
  readonly name: string
}
 
export const Schema = (name: string, schemaNode: SchemaNode): Schema => {
  const parsedSchema = parseSchemaNode(name, schemaNode) 

  const get = (path: string): PropertyDescriptor => {
    const pathSections = path.split('.') 
    return getProp(pathSections, parsedSchema)
  }

  return {
    get,
    get root() { return parsedSchema },
    get name() { return name }
  }
}
