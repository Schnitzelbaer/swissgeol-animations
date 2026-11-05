// Ortschaften für die erzeugten Bohrungen: Lage (WGS84), typische Terrainhöhe, Kanton, Anzahl Bohrungen
// und Streuung in km. Dicht im Mittelland und um die Städte, dünn in den Alpentälern.
// Grenznahe Orte sind leicht ins Landesinnere verschoben und streuen wenig, damit keine Bohrung im Ausland liegt.

export type Canton =
  | 'AG' | 'AR' | 'BE' | 'BL' | 'BS' | 'FR' | 'GE' | 'GL' | 'GR' | 'JU' | 'LU' | 'NE' | 'SG' | 'SH' | 'SO' | 'SZ' | 'TG' | 'TI' | 'UR' | 'VD' | 'VS' | 'ZG' | 'ZH'

export type Place = { name: string; lat: number; lon: number; elevation: number; canton: Canton; count: number; spread: number }

export const PLACES: Place[] = [
  // Region Sursee (Figma-Ausschnitt): nur für Gemeinde und Höhe der Figma-Bohrungen, dort entstehen keine weiteren
  { name: 'Sursee', lat: 47.1713, lon: 8.1108, elevation: 506, canton: 'LU', count: 0, spread: 1 },
  { name: 'Geuensee', lat: 47.1985, lon: 8.105, elevation: 512, canton: 'LU', count: 0, spread: 1 },
  { name: 'Büron', lat: 47.2122, lon: 8.092, elevation: 514, canton: 'LU', count: 0, spread: 1 },
  { name: 'Knutwil', lat: 47.1993, lon: 8.0735, elevation: 548, canton: 'LU', count: 0, spread: 1 },
  { name: 'Schenkon', lat: 47.1744, lon: 8.133, elevation: 521, canton: 'LU', count: 0, spread: 1 },
  { name: 'Oberkirch', lat: 47.1567, lon: 8.115, elevation: 518, canton: 'LU', count: 0, spread: 1 },
  { name: 'Rickenbach (LU)', lat: 47.219, lon: 8.153, elevation: 664, canton: 'LU', count: 0, spread: 1 },
  { name: 'Mauensee', lat: 47.169, lon: 8.067, elevation: 515, canton: 'LU', count: 0, spread: 1 },
  { name: 'Triengen', lat: 47.235, lon: 8.078, elevation: 509, canton: 'LU', count: 0, spread: 1 },
  { name: 'Beromünster', lat: 47.206, lon: 8.193, elevation: 646, canton: 'LU', count: 0, spread: 1 },
  // Mittelland und Städte
  { name: 'Zürich', lat: 47.385, lon: 8.52, elevation: 408, canton: 'ZH', count: 42, spread: 4 },
  { name: 'Winterthur', lat: 47.4988, lon: 8.7237, elevation: 439, canton: 'ZH', count: 14, spread: 2.5 },
  { name: 'Uster', lat: 47.3471, lon: 8.7209, elevation: 464, canton: 'ZH', count: 8, spread: 2.5 },
  { name: 'Bülach', lat: 47.521, lon: 8.54, elevation: 428, canton: 'ZH', count: 6, spread: 2.5 },
  { name: 'Dietikon', lat: 47.4017, lon: 8.4002, elevation: 388, canton: 'ZH', count: 6, spread: 2 },
  { name: 'Baden', lat: 47.4733, lon: 8.3059, elevation: 385, canton: 'AG', count: 10, spread: 2.5 },
  { name: 'Aarau', lat: 47.3925, lon: 8.0444, elevation: 383, canton: 'AG', count: 12, spread: 3 },
  { name: 'Lenzburg', lat: 47.388, lon: 8.176, elevation: 400, canton: 'AG', count: 6, spread: 2 },
  { name: 'Wohlen (AG)', lat: 47.351, lon: 8.278, elevation: 427, canton: 'AG', count: 4, spread: 2 },
  { name: 'Basel', lat: 47.545, lon: 7.612, elevation: 260, canton: 'BS', count: 14, spread: 1.2 },
  { name: 'Liestal', lat: 47.484, lon: 7.735, elevation: 327, canton: 'BL', count: 10, spread: 2.5 },
  { name: 'Olten', lat: 47.3499, lon: 7.9033, elevation: 396, canton: 'SO', count: 8, spread: 2.5 },
  { name: 'Solothurn', lat: 47.2088, lon: 7.5323, elevation: 432, canton: 'SO', count: 10, spread: 2.5 },
  { name: 'Bern', lat: 46.948, lon: 7.4474, elevation: 540, canton: 'BE', count: 30, spread: 4 },
  { name: 'Burgdorf', lat: 47.059, lon: 7.627, elevation: 533, canton: 'BE', count: 5, spread: 2 },
  { name: 'Langenthal', lat: 47.215, lon: 7.787, elevation: 472, canton: 'BE', count: 5, spread: 2 },
  { name: 'Thun', lat: 46.765, lon: 7.615, elevation: 560, canton: 'BE', count: 9, spread: 2 },
  { name: 'Biel/Bienne', lat: 47.145, lon: 7.255, elevation: 434, canton: 'BE', count: 11, spread: 2 },
  { name: 'Interlaken', lat: 46.6863, lon: 7.8632, elevation: 568, canton: 'BE', count: 4, spread: 1 },
  { name: 'Fribourg', lat: 46.8065, lon: 7.1619, elevation: 610, canton: 'FR', count: 10, spread: 2.5 },
  { name: 'Bulle', lat: 46.618, lon: 7.057, elevation: 771, canton: 'FR', count: 4, spread: 2 },
  { name: 'Neuchâtel', lat: 47.0, lon: 6.94, elevation: 430, canton: 'NE', count: 8, spread: 1.5 },
  { name: 'La Chaux-de-Fonds', lat: 47.1035, lon: 6.8328, elevation: 1000, canton: 'NE', count: 4, spread: 1.5 },
  { name: 'Delémont', lat: 47.3649, lon: 7.3445, elevation: 413, canton: 'JU', count: 4, spread: 1.5 },
  { name: 'Lausanne', lat: 46.535, lon: 6.63, elevation: 495, canton: 'VD', count: 20, spread: 2.5 },
  { name: 'Yverdon-les-Bains', lat: 46.7785, lon: 6.6411, elevation: 435, canton: 'VD', count: 6, spread: 1.5 },
  { name: 'Nyon', lat: 46.39, lon: 6.225, elevation: 410, canton: 'VD', count: 6, spread: 1.5 },
  { name: 'Vevey', lat: 46.47, lon: 6.85, elevation: 385, canton: 'VD', count: 5, spread: 1.2 },
  { name: 'Genève', lat: 46.205, lon: 6.14, elevation: 375, canton: 'GE', count: 20, spread: 1.8 },
  { name: 'Luzern', lat: 47.05, lon: 8.3, elevation: 435, canton: 'LU', count: 16, spread: 2.5 },
  { name: 'Emmen', lat: 47.078, lon: 8.273, elevation: 430, canton: 'LU', count: 6, spread: 1.5 },
  { name: 'Zug', lat: 47.17, lon: 8.52, elevation: 425, canton: 'ZG', count: 10, spread: 2 },
  { name: 'Schwyz', lat: 47.0207, lon: 8.653, elevation: 516, canton: 'SZ', count: 4, spread: 1.5 },
  { name: 'Altdorf', lat: 46.8805, lon: 8.6444, elevation: 447, canton: 'UR', count: 4, spread: 1 },
  { name: 'Glarus', lat: 47.0404, lon: 9.068, elevation: 472, canton: 'GL', count: 3, spread: 1 },
  { name: 'St. Gallen', lat: 47.4245, lon: 9.3767, elevation: 670, canton: 'SG', count: 12, spread: 2.5 },
  { name: 'Wil (SG)', lat: 47.4615, lon: 9.045, elevation: 571, canton: 'SG', count: 5, spread: 2 },
  { name: 'Rapperswil-Jona', lat: 47.235, lon: 8.84, elevation: 409, canton: 'SG', count: 5, spread: 1.5 },
  { name: 'Sargans', lat: 47.049, lon: 9.44, elevation: 482, canton: 'SG', count: 4, spread: 1 },
  { name: 'Herisau', lat: 47.386, lon: 9.279, elevation: 771, canton: 'AR', count: 3, spread: 1.5 },
  { name: 'Frauenfeld', lat: 47.5536, lon: 8.8986, elevation: 417, canton: 'TG', count: 8, spread: 2.5 },
  { name: 'Weinfelden', lat: 47.566, lon: 9.107, elevation: 432, canton: 'TG', count: 4, spread: 1.5 },
  { name: 'Schaffhausen', lat: 47.705, lon: 8.62, elevation: 403, canton: 'SH', count: 6, spread: 1.2 },
  // Alpentäler
  { name: 'Chur', lat: 46.8508, lon: 9.532, elevation: 593, canton: 'GR', count: 8, spread: 1.5 },
  { name: 'Landquart', lat: 46.967, lon: 9.554, elevation: 525, canton: 'GR', count: 4, spread: 1 },
  { name: 'Davos', lat: 46.8027, lon: 9.836, elevation: 1560, canton: 'GR', count: 3, spread: 1 },
  { name: 'St. Moritz', lat: 46.4908, lon: 9.8355, elevation: 1822, canton: 'GR', count: 3, spread: 1 },
  { name: 'Martigny', lat: 46.1028, lon: 7.0726, elevation: 470, canton: 'VS', count: 4, spread: 1 },
  { name: 'Sion', lat: 46.2331, lon: 7.3606, elevation: 512, canton: 'VS', count: 7, spread: 1.5 },
  { name: 'Sierre', lat: 46.292, lon: 7.535, elevation: 533, canton: 'VS', count: 4, spread: 1 },
  { name: 'Visp', lat: 46.293, lon: 7.881, elevation: 650, canton: 'VS', count: 4, spread: 1 },
  { name: 'Brig-Glis', lat: 46.315, lon: 7.987, elevation: 680, canton: 'VS', count: 3, spread: 1 },
  { name: 'Bellinzona', lat: 46.1955, lon: 9.017, elevation: 240, canton: 'TI', count: 6, spread: 1.5 },
  { name: 'Locarno', lat: 46.175, lon: 8.795, elevation: 205, canton: 'TI', count: 4, spread: 1 },
  { name: 'Lugano', lat: 46.015, lon: 8.95, elevation: 273, canton: 'TI', count: 10, spread: 1.5 },
  { name: 'Mendrisio', lat: 45.87, lon: 8.98, elevation: 354, canton: 'TI', count: 4, spread: 1 },
]

/** Grosse Seen als grobe Kreise (Breite, Länge, Radius in km): dort entstehen keine Bohrungen */
export const LAKES: [number, number, number][] = [
  // Genfersee
  [46.45, 6.55, 6.2], [46.41, 6.38, 4.5], [46.37, 6.25, 3], [46.42, 6.72, 4.2], [46.4, 6.86, 2.8], [46.3, 6.2, 2],
  // Zürichsee
  [47.34, 8.55, 1.4], [47.31, 8.6, 1.6], [47.27, 8.67, 1.6], [47.23, 8.75, 1.6], [47.21, 8.83, 1.5],
  // Bodensee
  [47.6, 9.4, 10], [47.67, 9.25, 3],
  // Neuenburgersee
  [46.85, 6.76, 3], [46.9, 6.84, 3.2], [46.95, 6.9, 2.6],
  // Vierwaldstättersee, Zugersee, Sempachersee
  [47.03, 8.35, 2], [47.0, 8.45, 2.5], [46.99, 8.57, 2], [47.12, 8.49, 2.6], [47.14, 8.155, 1.8],
  // Thuner-, Brienzer-, Bielersee
  [46.7, 7.72, 2.6], [46.73, 7.96, 2.2], [47.085, 7.17, 2.4],
  // Lago Maggiore, Lago di Lugano
  [46.13, 8.78, 2.5], [45.98, 8.98, 2.2],
]

/** Startausschnitt der Boreholes-Karte (Figma-Screen) mit etwas Rand: Dort bleiben nur die 24 Figma-Bohrungen */
export const START_VIEW = { west: 7.93, east: 8.27, south: 47.09, north: 47.26 }
