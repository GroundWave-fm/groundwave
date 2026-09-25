import { latLngToCell, gridDisk, cellToLatLng } from 'h3-js';

// Default resolution 8 gives ~460m to 1km hex diameter (ideal for neighborhood/city privacy)
export const DEFAULT_H3_RESOLUTION = 8;

/**
 * Converts raw latitude and longitude into an obfuscated H3 hexagonal cell index.
 */
export function latLngToH3(lat: number, lng: number, resolution = DEFAULT_H3_RESOLUTION): string {
  return latLngToCell(lat, lng, resolution);
}

/**
 * Returns a list of all H3 hexagonal cells within k steps of a center cell (Local Scene Radar).
 * k = 1: ~1.5km radius
 * k = 3: ~5km radius (Neighborhood)
 * k = 8: ~25km radius (Metro Area)
 * k = 20: ~100km radius (Regional)
 */
export function getSceneRadiusH3Cells(centerH3: string, kRingSteps = 8): string[] {
  return gridDisk(centerH3, kRingSteps);
}

/**
 * Returns the center coordinates of an H3 cell for distance approximations.
 */
export function h3ToCenterLatLng(h3Index: string): [number, number] {
  return cellToLatLng(h3Index);
}

// Canonical city center coordinates for quick testing & fallback indexing
export const KNOWN_CITIES: Record<string, { lat: number; lng: number; country: string }> = {
  Chicago: { lat: 41.8781, lng: -87.6298, country: 'US' },
  Austin: { lat: 30.2672, lng: -97.7431, country: 'US' },
  Nashville: { lat: 36.1627, lng: -86.7816, country: 'US' },
  Bristol: { lat: 51.4545, lng: -2.5879, country: 'GB' },
  London: { lat: 51.5074, lng: -0.1278, country: 'GB' },
  Berlin: { lat: 52.52, lng: 13.405, country: 'DE' },
  Detroit: { lat: 42.3314, lng: -83.0458, country: 'US' },
  Minneapolis: { lat: 44.9778, lng: -93.265, country: 'US' },
};
