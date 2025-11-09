import { useState, useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { checkinService } from '@/services/checkin.service'
import { ICheckinNFT } from '@/types'

export default function Collection() {
  const { publicKey, isConnected } = useWallet()
  const [nfts, setNfts] = useState<ICheckinNFT[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isConnected && publicKey) {
      loadNFTs()
    }
  }, [isConnected, publicKey])

  const loadNFTs = async () => {
    if (!publicKey) return
    
    setLoading(true)
    try {
      const userNFTs = await checkinService.getUserNFTs(publicKey)
      setNfts(userNFTs)
    } catch (error) {
      console.error('Error loading NFTs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-3xl font-bold mb-4">📦 My Check-in Collection</h1>
          <p className="text-gray-600 mb-6">
            Connect your wallet to view your Check-in collection
          </p>
          <div className="text-6xl mb-4">🔒</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📦 My NFT Collection</h1>
        <p className="text-gray-600">
          {nfts.length} {nfts.length === 1 ? 'NFT collected' : 'NFTs collected'}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando tu colección...</p>
        </div>
      ) : nfts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-xl font-semibold mb-2">You don't have NFTs yet</h2>
          <p className="text-gray-600 mb-6">
            Visit tourist places and check-in to collect NFTs
          </p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir al Mapa
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map((nft) => (
            <div
              key={nft.token_id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                <img
                  src={nft.image_url}
                  alt={nft.place_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=NFT'
                  }}
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  #{nft.token_id}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{nft.place_name}</h3>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span>Place ID: {nft.place_id}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{formatDate(nft.check_in_timestamp)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span>🌍</span>
                    <span className="text-xs">
                      {(nft.latitude / 1e6).toFixed(4)}, {(nft.longitude / 1e6).toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
