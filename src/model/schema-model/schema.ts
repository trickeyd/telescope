import lodashGet from 'lodash.get'
import isString from 'lodash.isstring'
import isNumber from 'lodash.isnumber'
import isDate from 'lodash.isdate'
import isBoolean from 'lodash.isboolean'
import isArray from 'lodash.isarray'
import isUndefined from 'lodash.isundefined'
import isPlainObject from 'lodash.isplainobject'
import {
  IBool,
  INum,
  IStr,
  IArr,
  IDate,
  IObj ,
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
import { validateAll, createValidatorAdder, createLengthValidation, createCommonValidation, createDateValidation } from "./validation";
import { Signal } from "../../signals/signal";

const createSchemaType = <T extends unknown>(propType: PropertyType, contentNode?: SchemaNode, ...validationEnablerFactories: ValidationEnablerMapFactory[]): T => {
  const validators: Validator[] = []
  const updated: Signal<unknown> = Signal()
  const content = contentNode ? parseSchemaObject(contentNode, updated, propType) : undefined; 
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
export const Date = (): IDate => createSchemaType<IDate>(PropertyType.date, undefined, createCommonValidation(isDate, PropertyType.date), createDateValidation())
export const Arr = (contentSchema: SchemaNode): IArr => {
  if(isUndefined(contentSchema))
    throw Error('The Arr SchemaType function requires a SchemaNode to be passed.')
  return createSchemaType<IArr>(PropertyType.array, contentSchema, createCommonValidation(isArray, PropertyType.array), createValidatorAdder(), createLengthValidation())
}

export const Obj = (contentSchema: SchemaConfig): IObj => {
  if(isUndefined(contentSchema))
    throw Error('The Obj SchemaType function requires a SchemaConfig to be passed.')
  return createSchemaType<IObj>(PropertyType.object, contentSchema, createCommonValidation(isPlainObject, PropertyType.object), createValidatorAdder())
} 

// replace literals with schema types
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
const parseSchemaObject = (schemaNode: SchemaNode, updateParent: Signal<unknown>, propType: PropertyType): SchemaNodeContent | PropertyDescriptor => {
  if(propType === PropertyType.array){
    const node =  parseSchemaNode('values', schemaNode)
    updateParent && node.updated.on(updateParent.emit)
    return node
  } else {
    return Object.entries(schemaNode).reduce(
      (acc: { [key: string]: PropertyDescriptor}, [key, value]: [string, SchemaNode]) => {
        const node = acc[key] = parseSchemaNode(key, value)
        updateParent && node.updated.on(updateParent.emit)
        return acc 
      },
      {}
    )  
  }
}

export interface Schema {
  get: (path: string) => PropertyDescriptor
  readonly root: PropertyDescriptor
}
 
export const Schema = (schemaNode: SchemaNode): Schema => {
  const parsedSchema = parseSchemaNode('root', schemaNode) 
  return {
    get (path: string) {
      const parsedPath = 'content.' + path.split('.').join('.content.').split(/\[.\]/).join('.content') 
      const prop = lodashGet(parsedSchema, parsedPath)
      if(!prop) throw Error(`Property "${path}" does not exist on "${parsedSchema.name}".`)
      return prop
    },
    get root() { return parsedSchema },
  }
}
