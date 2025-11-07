import { useState, useEffect } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  error: string | null
  loading: boolean
}

export function useGeolocation(demoMode: boolean, demoLat?: number, demoLng?: number) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  })

  useEffect(() => {
    // Si está en modo demo, usar coordenadas demo
    if (demoMode && demoLat && demoLng) {
      setState({
        latitude: demoLat,
        longitude: demoLng,
        error: null,
        loading: false,
      })
      return
    }

    // Verificar si el navegador soporta geolocalización
    if (!navigator.geolocation) {
      setState({
        latitude: null,
        longitude: null,
        error: 'Tu navegador no soporta geolocalización',
        loading: false,
      })
      return
    }

    // Obtener ubicación real
    const successHandler = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        loading: false,
      })
    }

    const errorHandler = (error: GeolocationPositionError) => {
      let errorMessage = 'Error al obtener ubicación'
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permiso de ubicación denegado. Activa el Modo Demo para continuar.'
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Ubicación no disponible'
          break
        case error.TIMEOUT:
          errorMessage = 'Tiempo de espera agotado'
          break
      }

      setState({
        latitude: null,
        longitude: null,
        error: errorMessage,
        loading: false,
      })
    }

    const watchId = navigator.geolocation.watchPosition(
      successHandler,
      errorHandler,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [demoMode, demoLat, demoLng])

  return state
}
