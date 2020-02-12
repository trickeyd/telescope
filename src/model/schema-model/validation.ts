import {
  Validator,
  MultiValidatorResult,
  PropertyDescriptor,
  ValidateStoreResult,
  PropertyType,
  StringToAny,
  ValidateStoreAccumulator,
  SchemaNode,
} from "./types";
import isUndefined from 'lodash.isUndefined'

export const isRequired = (returnObject: any, validators: Validator[]) =>
  () => {
    validators.push({ validate: (item) => !isUndefined(item), failMessage: 'undefined but marked required' })
    return returnObject
  }

export const validate = (returnObject: any, validators: Validator[]) =>
  (validator: Validator) => {
    validators.push(validator)
    return returnObject
  } 

 
export const validateAll = (validators: Validator[]) => (item: any): MultiValidatorResult =>
  validators.reduce((acc: MultiValidatorResult, validator: Validator): MultiValidatorResult => {
      if(!validator.validate(item)){
        acc.isValid = false
        acc.failMessages.push(validator.failMessage)
      }
      return acc
    },
    { isValid: true, failMessages: [] }
  )
 
export const validateStoreNodeDescriptor = (value: StringToAny, propDescriptor: PropertyDescriptor): ValidateStoreResult => {
  const { isValid, failMessages } = propDescriptor.validator(value) 
  const result = isValid ? 'passed' : `failed because it is ${failMessages.join(' and ')}.`

  if(isUndefined(value))
    return { isValid, validationMap: `${value} -> ${result}` }
    

  switch(propDescriptor.type){
    case PropertyType.object:
      const { isValid: objectIsValid, validationMap: objectValidationMap } = validateStoreObject(value, propDescriptor.content) 
      return { isValid: isValid && objectIsValid, validationMap: { __object: result, ...(objectValidationMap as StringToAny) }}

    case PropertyType.array:
      let arrayIsValid = true;
      const validationMap = { __array: result, values: value.map(
        (arrValue: any) => {
          const { isValid, validationMap: arrayValidationMap } = validateStoreObject(arrValue, propDescriptor.content) 
          arrayIsValid = isValid ? arrayIsValid : isValid
          return arrayValidationMap 
        }
      )}
     return { isValid: isValid && arrayIsValid, validationMap } 

    default:
      return { isValid, validationMap: `${value} -> ${result}` }
  }
}
   
const validateStoreObject = (store: StringToAny, schemaNode: SchemaNode): ValidateStoreResult => {
  const { isValid, storeKeys, validationMap}: ValidateStoreAccumulator = Object.entries(schemaNode).reduce(
    (
      { isValid: storeIsValid, storeKeys, validationMap }: ValidateStoreAccumulator,
      [key, propDescriptor]: [string, PropertyDescriptor]
    ) => {
      const { isValid: nodeIsValid, validationMap: nodeValidationMap } = validateStoreNodeDescriptor(store[key], propDescriptor)
      validationMap[key] = nodeValidationMap;
      
      storeKeys.splice(storeKeys.indexOf(key), 1) 

      return {
        isValid: storeIsValid && nodeIsValid,
        storeKeys,
        validationMap
      }
    },
    { isValid: true, storeKeys: Object.keys(store), validationMap: {} } 
  )
  storeKeys.forEach((key: string) => validationMap[key] = '!! Property not in schema')

  return {
    isValid: storeKeys.length ? false : isValid,
    validationMap
  }
}



