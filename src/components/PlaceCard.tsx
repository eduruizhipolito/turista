import { useState, useCallback, useEffect } from 'react';
import { IPlace, ICheckinNFT } from '@/types';
import { useWallet } from '@/hooks/useWallet';
import { useGeolocation } from '@/hooks/useGeolocation';
import { calculateDistance, isWithinRadius } from '@/utils/distance';
import { checkinService } from '@/services/checkin.service';

const CUSCO_CENTER = { lat: -13.5165, lng: -71.9786 };

interface PlaceCardProps {
  place: IPlace;
  demoMode: boolean;
}

export default function PlaceCard({ place, demoMode }: PlaceCardProps) {
  const [checkingIn, setCheckingIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userNFTs, setUserNFTs] = useState<ICheckinNFT[]>([]);
  const [loadingNFTs, setLoadingNFTs] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const { publicKey, isConnected, kit } = useWallet();
  const { latitude, longitude, loading: geoLoading } = useGeolocation(
    demoMode,
    CUSCO_CENTER.lat,
    CUSCO_CENTER.lng
  );

  // Cargar NFTs del usuario
  const loadUserNFTs = useCallback(async () => {
    if (!publicKey) {
      setUserNFTs([]);
      return;
    }
    
    setLoadingNFTs(true);
    try {
      const nfts = await checkinService.getUserNFTs(publicKey);
      setUserNFTs(nfts);
    } catch (error) {
      console.error('Error loading user NFTs:', error);
      setUserNFTs([]);
    } finally {
      setLoadingNFTs(false);
    }
  }, [publicKey]);

  useEffect(() => {
    if (isConnected && publicKey) {
      loadUserNFTs();
    } else {
      setUserNFTs([]);
    }
  }, [isConnected, publicKey, loadUserNFTs]);

  const hasCheckedIn = userNFTs.some(nft => nft.place_id === place.id);

  const handleOpenModal = () => {
    console.log('🔍 handleOpenModal called for place:', place.name);
    console.log('🔍 Current showModal state:', showModal);
    setShowModal(true);
    console.log('🔍 setShowModal(true) executed');
  };

  const handleCheckin = useCallback(async () => {
    if (!isConnected || !publicKey || !kit) {
      setToast({ message: 'Por favor conecta tu wallet primero', type: 'error' });
      return;
    }

    if (!latitude || !longitude) {
      setToast({ message: 'No se pudo obtener tu ubicación', type: 'error' });
      return;
    }

    const withinRadius = isWithinRadius(latitude, longitude, place.lat, place.lng, place.radius);

    if (!withinRadius) {
      const distance = calculateDistance(latitude, longitude, place.lat, place.lng);
      setToast({ message: `Estás muy lejos (${Math.round(distance)}m). Debes estar a menos de ${place.radius}m del lugar.`, type: 'error' });
      return;
    }

    setCheckingIn(true);

    try {
      const result = await checkinService.performCheckin(kit, publicKey, {
        placeId: place.id,
        placeName: place.name,
        latitude: place.lat,
        longitude: place.lng,
        imageUrl: place.imageNFT,
      });

      if (result.success) {
        setToast({ message: `¡Check-in exitoso en ${place.name}! NFT minteado`, type: 'success' });
        setShowModal(false);
        await loadUserNFTs();
      } else {
        setToast({ message: `Error: ${result.error}`, type: 'error' });
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setToast({ message: 'Error al hacer check-in. Intenta de nuevo.', type: 'error' });
    } finally {
      setCheckingIn(false);
    }
  }, [isConnected, publicKey, kit, latitude, longitude, place, loadUserNFTs]);

  const canCheckin = latitude && longitude && isWithinRadius(latitude, longitude, place.lat, place.lng, place.radius);
  const distance = latitude && longitude ? calculateDistance(latitude, longitude, place.lat, place.lng) : null;

  return (
    <>
      <div 
        className={`bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-all duration-300 ${
          hasCheckedIn ? 'ring-4 ring-green-500' : ''
        }`}
      >
        <div className="relative">
          <img src={place.imageNFT} alt={place.name} className="w-full h-48 object-cover" />
          {hasCheckedIn && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              ✓ Visitado
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-1">{place.name}</h3>
          <p className="text-sm text-gray-600 mb-3 h-10 overflow-hidden">{place.description}</p>
          
          <div className="flex items-center justify-between text-xs mb-4">
            <span className={`px-2 py-1 rounded ${
              hasCheckedIn ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {place.category}
            </span>
          </div>

          <button
            onClick={handleOpenModal}
            className="w-full py-2 px-4 rounded font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Ver Detalles
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        console.log('✅ Rendering modal for:', place.name),
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img src={place.imageNFT} alt={place.name} className="w-full h-64 object-cover" />
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center text-gray-700 font-bold"
              >
                ×
              </button>
              {hasCheckedIn && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  ✓ Visitado
                </div>
              )}
            </div>
            
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">{place.name}</h2>
              <p className="text-gray-600 mb-4">{place.description}</p>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-500 mb-1">Categoría</p>
                  <p className="font-semibold text-sm">{place.category}</p>
                </div>
                {place.region && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500 mb-1">Región</p>
                    <p className="font-semibold text-sm">{place.region}</p>
                  </div>
                )}
                {place.altitude && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500 mb-1">Altitud</p>
                    <p className="font-semibold text-sm">{place.altitude.toLocaleString()} msnm</p>
                  </div>
                )}
                {distance !== null && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500 mb-1">Distancia</p>
                    <p className={`font-semibold text-sm ${
                      canCheckin ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {distance.toFixed(0)}m
                    </p>
                  </div>
                )}
              </div>

              {isConnected ? (
                hasCheckedIn ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded font-medium text-sm bg-gray-300 text-gray-600 cursor-not-allowed"
                  >
                    ✓ Already Checked-in
                  </button>
                ) : (
                  <button
                    onClick={handleCheckin}
                    disabled={checkingIn || geoLoading || !canCheckin}
                    className={`w-full py-3 px-4 rounded font-medium text-sm transition-colors ${
                      checkingIn || geoLoading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : canCheckin
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {geoLoading
                      ? 'Obteniendo ubicación...'
                      : checkingIn
                      ? '⏳ Haciendo Check-in...'
                      : canCheckin
                      ? '✓ Hacer Check-in'
                      : `Debes estar a menos de ${place.radius}m   para hacer Check-In`}
                  </button>
                )
              ) : (
                <p className="text-sm text-gray-500 text-center py-3">
                  Conecta tu wallet para hacer check-in
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
          <div className={`${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md`}>
            <span className="text-2xl">{toast.type === 'success' ? '✅' : '❌'}</span>
            <p className="flex-1 font-medium">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="text-white/80 hover:text-white text-xl font-bold leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
