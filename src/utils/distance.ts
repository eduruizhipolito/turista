/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @param lat1 Latitud del punto 1
 * @param lng1 Longitud del punto 1
 * @param lat2 Latitud del punto 2
 * @param lng2 Longitud del punto 2
 * @returns Distancia en metros
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3 // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distancia en metros
}

/**
 * Verifica si el usuario está dentro del radio de check-in
 * @param userLat Latitud del usuario
 * @param userLng Longitud del usuario
 * @param placeLat Latitud del lugar
 * @param placeLng Longitud del lugar
 * @param radius Radio permitido en metros
 * @returns true si está dentro del radio
 */
export function isWithinRadius(
  userLat: number,
  userLng: number,
  placeLat: number,
  placeLng: number,
  radius: number
): boolean {
  const distance = calculateDistance(userLat, userLng, placeLat, placeLng)
  return distance <= radius
}
