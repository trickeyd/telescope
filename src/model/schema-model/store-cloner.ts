/*import { PropertyType, PropertyDescriptor } from "./types";

export const clone = (store: any, node: ModelNode) => {
  if(!store) return store;



  switch(descriptor.type){
    case PropertyType.string:
    case PropertyType.number:
    case PropertyType.boolean:
    case PropertyType.any:
      return store

    case PropertyType.array:
      return store.map((content: PropertyDescriptor) =>
        clone(content, descriptor.content))

    case PropertyType.object:
      return Object.entries(descriptor.content).reduce(
        (acc:{ [key: string]: any }, [key, value]) => {
          acc[key] = clone(value, descriptor.content[key])
          return acc
        },
        {}
      )
  }
}*/
