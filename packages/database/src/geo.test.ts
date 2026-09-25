import { describe, it, expect } from 'vitest';
import {
  latLngToH3,
  getSceneRadiusH3Cells,
  h3ToCenterLatLng,
  DEFAULT_H3_RESOLUTION,
  KNOWN_CITIES,
} from './geo';

describe('Geo & H3 Spatial Indexing Utilities', () => {
  it('should have default resolution 8', () => {
    expect(DEFAULT_H3_RESOLUTION).toBe(8);
  });

  it('converts Chicago coordinates to a valid resolution 8 H3 index', () => {
    const chicago = KNOWN_CITIES.Chicago;
    const h3Index = latLngToH3(chicago.lat, chicago.lng);

    expect(typeof h3Index).toBe('string');
    expect(h3Index.length).toBeGreaterThan(10);
  });

  it('converts custom coordinates and respects custom resolution', () => {
    const res7Index = latLngToH3(KNOWN_CITIES.Austin.lat, KNOWN_CITIES.Austin.lng, 7);
    const res8Index = latLngToH3(KNOWN_CITIES.Austin.lat, KNOWN_CITIES.Austin.lng, 8);

    expect(res7Index).not.toBe(res8Index);
  });

  it('computes center coordinates approximating the original coordinate', () => {
    const originalLat = 41.8781;
    const originalLng = -87.6298;
    const h3Index = latLngToH3(originalLat, originalLng);
    const [centerLat, centerLng] = h3ToCenterLatLng(h3Index);

    // Resolution 8 precision is within ~0.01 degrees
    expect(Math.abs(centerLat - originalLat)).toBeLessThan(0.02);
    expect(Math.abs(centerLng - originalLng)).toBeLessThan(0.02);
  });

  it('generates correct k-ring cell sets for Scene Radar radii', () => {
    const chicagoH3 = latLngToH3(KNOWN_CITIES.Chicago.lat, KNOWN_CITIES.Chicago.lng);

    const k1 = getSceneRadiusH3Cells(chicagoH3, 1);
    // k=1 ring on a hex grid produces 1 + 6 = 7 cells
    expect(k1.length).toBe(7);
    expect(k1).toContain(chicagoH3);

    const k3 = getSceneRadiusH3Cells(chicagoH3, 3);
    // k=3 ring produces 1 + 3 * k * (k+1) = 37 cells
    expect(k3.length).toBe(37);

    const k8 = getSceneRadiusH3Cells(chicagoH3, 8);
    // k=8 ring produces 1 + 3 * 8 * 9 = 217 cells
    expect(k8.length).toBe(217);
  });

  it('contains valid coordinate definitions for all canonical known cities', () => {
    const cities = Object.keys(KNOWN_CITIES);
    expect(cities).toContain('Chicago');
    expect(cities).toContain('Austin');
    expect(cities).toContain('Bristol');
    expect(cities).toContain('London');
    expect(cities).toContain('Berlin');

    for (const city of cities) {
      const { lat, lng, country } = KNOWN_CITIES[city];
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);
      expect(country.length).toBe(2);
    }
  });
});
