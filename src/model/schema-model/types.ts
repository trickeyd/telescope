import { StringToAny } from "../../types";
import { Signal } from "../../signals/signal";
 
export type Validator = (item: any) => true | string 
export type MultiValidatorResult = { isValid: boolean, failMessage: string }

export interface ValidateStoreResult {
  isValid: boolean,
  validationMap: StringToAny | string
} 

export interface ValidateStoreAccumulator extends ValidateStoreResult {
  storeKeys: string[]
  validationMap: StringToAny 
}

export interface PropertyDescriptor {
  name:string
  type: PropertyType,
  validate: (item: any) => MultiValidatorResult,
  contentNode?: SchemaNode,
} 

export enum PropertyType {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  object = 'object',
  array = 'array',
  date = 'date',
  any = 'any'
}

export type ValidationEnablerMap<T> = { [ key: string ]: (...args: any) => T }  
export type ValidationEnablerMapFactory = <T>(returnObject:T, validators: Validator[]) => ValidationEnablerMap<T>  
 
export interface SchemaType {
  (name: string): PropertyDescriptor
}

interface CommonValidation<T> extends SchemaType { 
  required: () => T
  nullable: () => T
  defaultValue: () => T
}

interface LengthValidation<T> extends SchemaType { 
  setLength: (setLength: number) => T
  maxLength: (maxLength: number) => T
  minLength: (minLength: number) => T
}

interface AddValidator<T> extends SchemaType {
  validate: (validator: Validator) => T
}

interface DateValidation<T> extends SchemaType {
  laterThan: (date: Date) => T
  earlierThan: (date: Date) => T
}

export interface IStr extends CommonValidation<IStr>, LengthValidation<IStr>, AddValidator<IStr> { }
export interface INum extends CommonValidation<INum>, AddValidator<INum> { }
export interface IBool extends CommonValidation<IBool> { }
export interface IAny extends CommonValidation<IAny>, AddValidator<IAny> { } 
export interface IArr extends CommonValidation<IArr>, LengthValidation<IArr>, AddValidator<IArr> { } 
export interface IObj extends CommonValidation<IObj>, AddValidator<IObj> { } 
export interface IDate extends CommonValidation<IDate>, DateValidation<IDate> { }

export type SchemaNodeContent = { [key: string]: PropertyDescriptor }
export type SchemaConfig = { [key: string]: SchemaNode }
export type SchemaNode = SchemaType | SchemaConfig | SchemaConfig[]
