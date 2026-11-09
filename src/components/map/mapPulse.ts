import { createContext, useContext } from 'react'

/**
 * Lässt alle Objekte auf der Karte kurz violett aufleuchten (Glühbirne in der Legende), damit man sie auf unruhigen
 * Hintergründen wie dem Luftbild findet. MapView stellt die Funktion bereit, die Legende ruft sie auf.
 */
export const MapPulseContext = createContext<(() => void) | null>(null)

export function useMapPulse() {
  return useContext(MapPulseContext)
}
