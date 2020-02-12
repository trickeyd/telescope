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

export interface SchemaType<T> {
  (name: string): PropertyDescriptor
  isRequired: () => T
  validate: (validator: Validator) => T 
}
 

export interface IStr extends SchemaType<IStr> {
}

export interface INum extends SchemaType<INum> {
}

export interface IBool extends SchemaType<IBool> {
}

export interface IAny extends SchemaType<IAny> {
} 
 
export interface IArr extends SchemaType<IArr> {
} 

export interface IObj extends SchemaType<IObj> {
} 

export type SchemaConfig = { [key: string]: SchemaType<any> }
export type SchemaNode = SchemaType<any> | SchemaConfig | SchemaConfig[]
