import { Data } from "../core/data-object";
 
interface StackItem {
  functionName: string
  guardResult: boolean | null
  depth: number
}

const createSpace = (length: number) => new Array(length).join(' ') 

const addToStack = (stack: StackItem[]) =>
  (functionName: string, depth: number, guardResult: boolean | null = null) => {
    stack[stack.length] = {
      functionName,
      depth,
      guardResult
    };
  };

const logStack = (stack: StackItem[]) => () => {
  const logString = '';
  stack.forEach((stackItem: StackItem) => {
    const isGuard = stackItem.guardResult !== null;
    const str = createSpace(stackItem.depth * 2 + 1) + (
      isGuard
        ? `if(${stackItem.functionName}) == ${stackItem.guardResult}`
        : stackItem.functionName
    ) + "\n"
  })
  console.log(logString)
};
 
const log = (jobId: string, depth: number) => (...args: any[]) => {
  const spaceBefore =  Math.ceil((14 - jobId.length) / 2)
  const spaceAfter =  Math.floor((14 - jobId.length) / 2)

  let startingText = `|${createSpace(spaceBefore)}${jobId}${createSpace(spaceAfter)} |`
  console.log(`${startingText}${createSpace((depth + 1) * 2)}`,...args)
};

export interface Debug {
  addToStack: (functionName: string, depth: number, guardResult: boolean | null) => void
  logStack: () => void
  log: (depth: number, ...args: any[]) => void
  jobId: string,
  stack: StackItem[]
  depth: number
} 
 
export const createDebugObject = (jobId: string, depth: number, stack: StackItem[] = []): Debug => {
  return {
    addToStack: addToStack(stack),
    logStack: logStack(stack),
    log: log(jobId, depth),
    get jobId() { return jobId },
    get stack() { return stack },
    get depth() { return depth },
  }
};

