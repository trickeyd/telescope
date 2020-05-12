import { useState, useEffect, useCallback } from "react"
import { useTelescope } from "./useTelescope";
import { Model } from "../../model/schema-model/model";
import { SignalFetcher, Telescope } from "../../map/application-map";

export const useSignal = (signalFetcher: SignalFetcher) => {
  const telescope: Telescope = useTelescope()
  const signalMap = telescope.signalMap
  const signal = signalFetcher(signalMap)

  return signal.emit
}

