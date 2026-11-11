/**
 * Geographic projection and metric conversion utilities.
 * Ensures consistent conversion between meters in 3D simulation and WGS84 (Lng/Lat) coordinates.
 */

// Earth radius in meters (WGS84 mean radius)
const EARTH_RADIUS = 6378137.0;

/**
 * Calculates meters per degree of latitude at a given latitude.
 */
export function getMetersPerDegreeLat(): number {
  return (Math.PI / 180.0) * EARTH_RADIUS; // ~ 111,319.49 m
}

/**
 * Calculates meters per degree of longitude at a given latitude.
 */
export function getMetersPerDegreeLng(latDegrees: number): number {
  const latRad = (latDegrees * Math.PI) / 180.0;
  return (Math.PI / 180.0) * EARTH_RADIUS * Math.cos(latRad);
}

/**
 * Converts metric displacement (dx: East, dy: North) in meters to delta coordinates [deltaLng, deltaLat] in degrees.
 */
export function metersToDeltaDegrees(dxMeters: number, dyMeters: number, currentLat: number): [number, number] {
  const metersPerDegLat = getMetersPerDegreeLat();
  const metersPerDegLng = getMetersPerDegreeLng(currentLat);

  const deltaLat = dyMeters / metersPerDegLat;
  const deltaLng = dxMeters / (metersPerDegLng === 0 ? 1 : metersPerDegLng);

  return [deltaLng, deltaLat];
}

/**
 * Converts a delta in coordinates [deltaLng, deltaLat] to metric displacement [dx, dy] in meters.
 */
export function deltaDegreesToMeters(deltaLng: number, deltaLat: number, currentLat: number): [number, number] {
  const metersPerDegLat = getMetersPerDegreeLat();
  const metersPerDegLng = getMetersPerDegreeLng(currentLat);

  const dxMeters = deltaLng * metersPerDegLng;
  const dyMeters = deltaLat * metersPerDegLat;

  return [dxMeters, dyMeters];
}

/**
 * Calculates the Euclidean ground distance in meters between two [lng, lat] points using equirectangular approximation.
 * Highly accurate for local urban distances (< 20 km).
 */
export function distanceInMeters(
  pointA: [number, number],
  pointB: [number, number]
): number {
  const [lng1, lat1] = pointA;
  const [lng2, lat2] = pointB;

  const avgLat = (lat1 + lat2) / 2.0;
  const [dx, dy] = deltaDegreesToMeters(lng2 - lng1, lat2 - lat1, avgLat);

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the initial bearing in degrees (0 = North, 90 = East, 180 = South, 270 = West)
 * from pointA to pointB.
 */
export function calculateBearing(
  pointA: [number, number],
  pointB: [number, number]
): number {
  const [lng1, lat1] = pointA;
  const [lng2, lat2] = pointB;

  const lat1Rad = (lat1 * Math.PI) / 180.0;
  const lat2Rad = (lat2 * Math.PI) / 180.0;
  const deltaLngRad = ((lng2 - lng1) * Math.PI) / 180.0;

  const y = Math.sin(deltaLngRad) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLngRad);

  let bearing = (Math.atan2(y, x) * 180.0) / Math.PI;
  return (bearing + 360) % 360;
}
