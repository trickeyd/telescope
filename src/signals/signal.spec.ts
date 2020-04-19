import { Signal } from "./signal";

describe("Signal", () => {
  let signal: Signal<any>
  let listener1: () => void
  let listener2: () => void
  let listener3: () => void
  let payload = { msg: "my payload" }
   
  beforeEach(() => {
    signal = Signal()
    listener1 = jest.fn()
    listener2 = jest.fn()
    listener3 = jest.fn()
  })

  describe("when listeners are added", () => {
    beforeEach(() => {
      signal.on(listener1)
      signal.on(listener2)
    })

    it("should return appropriate boolean when using 'had'", () => {
      expect(signal.has(listener1)).toEqual(true)
      expect(signal.has(listener2)).toEqual(true)
      expect(signal.has(listener3)).toEqual(false)
    })

    describe("when emitting", () => {
      it("should call listeners with no payload", () => {
        signal.emit()
        expect(listener1).toHaveBeenCalledWith(undefined)
        expect(listener2).toHaveBeenCalledWith(undefined)
        expect(listener3).not.toHaveBeenCalled()
      })

      it("should call listeners with payload", () => {
        signal.emit(payload)
        expect(listener1).toHaveBeenCalledWith(payload)
        expect(listener2).toHaveBeenCalledWith(payload)
        expect(listener3).not.toHaveBeenCalled()
      })
    })

    describe("when listeners are removed", () => {
      beforeEach(() => {
        signal.un(listener1)
        signal.un(listener2)
      })

      it("should return appropriate boolean when using 'had'", () => {
        expect(signal.has(listener1)).toEqual(false)
        expect(signal.has(listener2)).toEqual(false)
        expect(signal.has(listener3)).toEqual(false)
      })

      it("should not call any listeners", () => {
        expect(listener1).not.toHaveBeenCalled()
        expect(listener2).not.toHaveBeenCalled()
        expect(listener3).not.toHaveBeenCalled()
      })
    })
  })

  describe("when single use listeners are added", () => {
    beforeEach(() => {
      signal.once(listener1)
      signal.once(listener2)
      signal.on(listener3)
    })

    it("should show appropriate value for 'has'", () => {
      expect(signal.has(listener1)).toEqual(true)
      expect(signal.has(listener2)).toEqual(true)
      expect(signal.has(listener3)).toEqual(true)
    })

    it("should remove them on emit", () => {
      signal.emit()
      expect(signal.has(listener1)).toEqual(false)
      expect(signal.has(listener2)).toEqual(false)
      expect(signal.has(listener3)).toEqual(true)
    })
  })

  describe("when using timed listeners", () => {
    it("should remove listener after specified number of emissions", (done) => {
      let specifiedNumber = 2
      const listener = jest.fn(() => {
        if(--specifiedNumber === 0){
          expect(signal.has(listener)).toEqual(false)
          expect(listener).toHaveBeenCalledTimes(2)
          done()
        }
      })
      signal.cron(listener, 1, true, specifiedNumber)
    })

    it("should emit immediately by when set", () => {
      signal.cron(listener1, 1, true, 1)
      expect(listener1).toHaveBeenCalledTimes(1)
    })

    it("should not emit immediately when set", (done) => {
      const listener = jest.fn(() => done())
      signal.cron(listener, 1, false, 1)
      expect(listener).not.toHaveBeenCalled()
    })

  })
})
