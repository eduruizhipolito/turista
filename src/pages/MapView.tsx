import { useState, useCallback, useEffect } from 'react'
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useWallet } from '@/hooks/useWallet'
import { PLACES } from '@/data/places'
import { calculateDistance, isWithinRadius } from '@/utils/distance'
import { checkinService } from '@/services/checkin.service'
import { IPlace, ICheckinNFT } from '@/types'

const CUSCO_CENTER = { lat: -13.5165, lng: -71.9786 }
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

export default function MapView() {
  const [demoMode] = useState(true) // Modo demo activado por defecto
  const [selectedPlace, setSelectedPlace] = useState<IPlace | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [userNFTs, setUserNFTs] = useState<ICheckinNFT[]>([])
  const [, setLoadingNFTs] = useState(false)
  const [, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  const { publicKey, isConnected, kit } = useWallet()
  const { latitude, longitude, error, loading } = useGeolocation(
    demoMode,
    CUSCO_CENTER.lat,
    CUSCO_CENTER.lng
  )

  // Cargar NFTs del usuario
  const loadUserNFTs = useCallback(async () => {
    if (!publicKey) {
      setUserNFTs([])
      return
    }
    
    setLoadingNFTs(true)
    try {
      const nfts = await checkinService.getUserNFTs(publicKey)
      setUserNFTs(nfts)
    } catch (error) {
      console.error('Error loading user NFTs:', error)
      setUserNFTs([])
    } finally {
      setLoadingNFTs(false)
    }
  }, [publicKey])

  // Cargar NFTs cuando el usuario se conecta
  useEffect(() => {
    if (isConnected && publicKey) {
      loadUserNFTs()
    } else {
      setUserNFTs([])
    }
  }, [isConnected, publicKey, loadUserNFTs])

  // Verificar si un lugar ya tiene check-in
  const hasCheckedIn = useCallback((placeId: number): boolean => {
    return userNFTs.some(nft => nft.place_id === placeId)
  }, [userNFTs])

  const handleMarkerClick = useCallback((place: IPlace) => {
    setSelectedPlace(place)
  }, [])

  const handleCloseInfo = useCallback(() => {
    setSelectedPlace(null)
  }, [])

  const handleCheckin = useCallback(async (place: IPlace) => {
    if (!isConnected || !publicKey || !kit) {
      setToast({ message: 'Por favor conecta tu wallet primero', type: 'error' })
      return
    }

    if (!latitude || !longitude) {
      setToast({ message: 'No se pudo obtener tu ubicación', type: 'error' })
      return
    }

    // Validar distancia
    const withinRadius = isWithinRadius(latitude, longitude, place.lat, place.lng, place.radius)
    
    if (!withinRadius) {
      const distance = calculateDistance(latitude, longitude, place.lat, place.lng)
      setToast({ message: `Estás muy lejos (${Math.round(distance)}m). Debes estar a menos de ${place.radius}m del lugar.`, type: 'error' })
      return
    }

    setCheckingIn(true)

    try {
      const result = await checkinService.performCheckin(kit, publicKey, {
        placeId: place.id,
        placeName: place.name,
        latitude: place.lat,
        longitude: place.lng,
        imageUrl: place.imageNFT,
      })

      if (result.success) {
        setToast({ message: `¡Check-in exitoso en ${place.name}! NFT minteado`, type: 'success' })
        setSelectedPlace(null)
        // Recargar NFTs después del check-in exitoso
        await loadUserNFTs()
      } else {
        setToast({ message: `Error: ${result.error}`, type: 'error' })
      }
    } catch (error) {
      console.error('Check-in error:', error)
      setToast({ message: 'Error al hacer check-in. Intenta de nuevo.', type: 'error' })
    } finally {
      setCheckingIn(false)
    }
  }, [isConnected, publicKey, kit, latitude, longitude, loadUserNFTs])

  if (!API_KEY) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">⚠️ API Key No Configurada</h2>
          <p className="text-red-600">
            Por favor configura VITE_GOOGLE_MAPS_API_KEY en tu archivo .env
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header con controles */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🗺️ Tu Ubicación</h1>
          <p className="text-sm text-gray-600">
            {loading && 'Obteniendo ubicación...'}
            {error && <span className="text-red-600">{error}</span>}
            {latitude && longitude && !loading && (
              <span className="text-green-600">
                📍 Ubicación: {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </span>
            )}
          </p>
        </div>

        {/* Toggle Modo Demo - Comentado, siempre activo */}
        {/* <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm font-medium text-gray-700">Modo Demo</span>
            <input
              type="checkbox"
              checked={demoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div> */}
      </div>

      {/* Mapa */}
      <div className="flex-1">
        <APIProvider apiKey={API_KEY}>
          <Map
            defaultCenter={CUSCO_CENTER}
            defaultZoom={14}
            mapId="turista-map"
            gestureHandling="greedy"
            disableDefaultUI={false}
          >
            {/* Marcadores de lugares turísticos */}
            {PLACES.map((place) => {
              const alreadyVisited = hasCheckedIn(place.id)
              return (
                <AdvancedMarker
                  key={place.id}
                  position={{ lat: place.lat, lng: place.lng }}
                  onClick={() => handleMarkerClick(place)}
                  title={place.name}
                >
                  <div className={`rounded-full w-10 h-10 flex items-center justify-center shadow-lg cursor-pointer transition-colors ${
                    alreadyVisited 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}>
                    <span className="text-lg">{alreadyVisited ? '✓' : '📍'}</span>
                  </div>
                </AdvancedMarker>
              )
            })}

            {/* Marcador de ubicación del usuario */}
            {latitude && longitude && (
              <AdvancedMarker
                position={{ lat: latitude, lng: longitude }}
                title="Tu ubicación"
              >
                <div className="bg-green-500 rounded-full w-4 h-4 border-2 border-white shadow-lg animate-pulse" />
              </AdvancedMarker>
            )}

            {/* Info Window */}
            {selectedPlace && latitude && longitude && (
              <InfoWindow
                position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
                onCloseClick={handleCloseInfo}
              >
                <div className="p-3 max-w-xs">
                  <h3 className="font-bold text-lg mb-1">{selectedPlace.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{selectedPlace.description}</p>
                  
                  <div className="flex items-center gap-2 text-xs mb-3 flex-wrap">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {selectedPlace.category}
                    </span>
                    <span className={`px-2 py-1 rounded font-medium ${
                      isWithinRadius(latitude, longitude, selectedPlace.lat, selectedPlace.lng, selectedPlace.radius)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {calculateDistance(latitude, longitude, selectedPlace.lat, selectedPlace.lng).toFixed(0)}m
                    </span>
                    {hasCheckedIn(selectedPlace.id) && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                        ✓ Visitado
                      </span>
                    )}
                  </div>

                  {isConnected ? (
                    hasCheckedIn(selectedPlace.id) ? (
                      <button
                        disabled
                        className="w-full py-2 px-4 rounded font-medium text-sm bg-gray-300 text-gray-600 cursor-not-allowed"
                      >
                        ✓ Already Checked-in
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCheckin(selectedPlace)}
                        disabled={checkingIn || !isWithinRadius(latitude, longitude, selectedPlace.lat, selectedPlace.lng, selectedPlace.radius)}
                        className={`w-full py-2 px-4 rounded font-medium text-sm transition-colors ${
                          checkingIn
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : isWithinRadius(latitude, longitude, selectedPlace.lat, selectedPlace.lng, selectedPlace.radius)
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {checkingIn ? '⏳ Haciendo Check-in...' : '✓ Hacer Check-in'}
                      </button>
                    )
                  ) : (
                    <p className="text-xs text-gray-500 text-center">
                      Conecta tu wallet para hacer check-in
                    </p>
                  )}
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

    </div>
  )
}
