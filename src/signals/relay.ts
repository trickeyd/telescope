import { Signal } from "./signal"; 

export interface Relay {
  (payload:any):  Promise<void>
  createSwitch: (onBreak: (payload: any) => void) => Switch
  removeSwitch: (relaySwitch: Switch) => void 
}

export interface Switch {
  onBreak: (payload: any)  => void
  isOn: boolean
  emit: (payload?: any) => void
  bypass: boolean
}

const Switch = (signal: Signal, onBreak:(payload: any) => void): Switch => {
  let isOn = false
  let bypass = true

  return {
    get isOn() {
      return isOn
    },

    onBreak(payload: any) {
      isOn = false
      onBreak(payload)
    },

    emit: (payload?: any) => {
      if(isOn) throw new Error("Relay switch already on")
      isOn = true
      signal.emit(payload)
    },

    set bypass(bypass: boolean) {
      bypass = bypass 
    }
  }
}

export const Relay = (): Relay => {
  const switches: Switch[] = []
  const responsePayloads: any[] = []
  const onSwitch = Signal()
  let resolveRelay: Function | undefined
  let rejectRelay: Function | undefined
  let isOn = true

  onSwitch.add((payload?: any) => {
    if(payload !== undefined) responsePayloads.push(payload)
    isOn = switches.every(swch => swch.isOn)
    if(isOn) {
      if(!resolveRelay || !rejectRelay) throw new Error("No switches have not been set")
      resolveRelay(responsePayloads)
      resolveRelay = undefined
      rejectRelay = undefined
    }
  })

  return Object.assign(
    (payload: any): Promise<void> => {
      return new Promise((resolve, reject) => {
        if(!isOn && rejectRelay) rejectRelay(new Error("Relay was reset before all switches emitted"))
        responsePayloads.length = 0
        isOn = false
        switches.forEach(currentSwitch => {
          currentSwitch.onBreak(payload)
          return { ...currentSwitch, isOn: false }
        })
        resolveRelay = resolve
        rejectRelay = reject
      }) 
    },
    {
      createSwitch(onBreak: (payload:any) => void): Switch {
        const relaySwitch = Switch(onSwitch, onBreak)
        switches.push(relaySwitch)
        return relaySwitch 
      },
      removeSwitch(relaySwitch: Switch): void {
        switches.splice(switches.indexOf(relaySwitch), 1)
      },
    }
  )
}
