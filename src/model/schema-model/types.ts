export type Validator = (item: any) => true | string 
export type MultiValidatorResult = { isValid: boolean, failMessage: string }
export type StringToAny = { [key: string] : any } 

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
  content?: any
} 

export enum PropertyType {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  object = 'object',
  array = 'array',
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
}

interface LengthValidation<T> extends SchemaType { 
  setLength: (setLength: number) => T
  maxLength: (maxLength: number) => T
  minLength: (minLength: number) => T
}

interface AddValidator<T> extends SchemaType {
  validate: (validator: Validator) => T
}

export interface IStr extends CommonValidation<IStr>, LengthValidation<IStr>, AddValidator<IStr> { }
export interface INum extends CommonValidation<INum>, AddValidator<INum> { }
export interface IBool extends CommonValidation<IBool> { }
export interface IAny extends CommonValidation<IAny>, AddValidator<IAny> { } 
export interface IArr extends CommonValidation<IArr>, LengthValidation<IArr>, AddValidator<IArr> { } 
export interface IObj extends CommonValidation<IObj>, AddValidator<IObj> { } 

export type SchemaNodeContent = { [key: string]: PropertyDescriptor }
export type SchemaConfig = { [key: string]: SchemaNode }
export type SchemaNode = SchemaType | SchemaConfig | SchemaConfig[]
