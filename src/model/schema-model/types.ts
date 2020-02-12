export type Validator = { validate: (item: any) => boolean, failMessage: string }
export type MultiValidatorResult = { isValid: boolean, failMessages: string[] }
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
  validator: (item: any) => MultiValidatorResult,
  content?: any
} 

export enum PropertyType {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  object = 'object',
  array = 'array'
}

export interface SchemaType {
  (name: string): PropertyDescriptor
}
 

export interface IStr extends SchemaType {
  isRequired: () => IStr
  validate: (validator: Validator) => IStr
}

export interface INum extends SchemaType  {
  isRequired: () => INum
  validate: (validator: Validator) => INum
}

export interface IBool extends SchemaType  {
  isRequired: () => IBool
}

export interface IAny extends SchemaType  {
  isRequired: () => IAny
  validate: (validator: Validator) => IAny
} 
 
export interface IArr extends SchemaType  {
  isRequired: () => IArr
  validate: (validator: Validator) => IArr
} 

export interface IObj extends SchemaType  {
  isRequired: () => IObj
  validate: (validator: Validator) => IObj
} 

export type SchemaConfig = { [key: string]: SchemaType }
export type SchemaNode = SchemaType | SchemaConfig | SchemaConfig[]
