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

export interface IStr {
  (name: string): PropertyDescriptor
  isRequired: () => IStr
  validate: (validator: Validator) => IStr
}

export interface INum {
  (name: string): PropertyDescriptor
  isRequired: () => INum
  validate: (validator: Validator) => INum
}

export interface IBool {
  (name: string): PropertyDescriptor
  isRequired: () => IBool
}

export interface IAny {
  (name: string): PropertyDescriptor
  isRequired: () => IAny
  validate: (validator: Validator) => IAny
} 
 
export interface IArr {
  (name: string): PropertyDescriptor
  isRequired: () => IArr
  validate: (validator: Validator) => IArr
} 

export interface IObj {
  (name: string): PropertyDescriptor
  isRequired: () => IObj
  validate: (validator: Validator) => IObj
} 

export type SchemaType = IStr | INum | IBool | IArr | IObj
export type SchemaConfig = { [key: string]: SchemaType }
export type SchemaNode = SchemaType | SchemaConfig | SchemaConfig[]
 

