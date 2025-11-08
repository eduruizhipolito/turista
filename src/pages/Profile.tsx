import { useWallet } from '@/hooks/useWallet'
import { useEffect, useState } from 'react'
import { balanceService } from '@/services/balance.service'
import { checkinService } from '@/services/checkin.service'

export default function Profile() {
  const { publicKey, isConnected } = useWallet()
  const [turBalance, setTurBalance] = useState<number>(0)
  const [nftCount, setNftCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!publicKey) return

    const loadData = async () => {
      setLoading(true)
      try {
        // Load TUR balance
        const balance = await balanceService.getTURBalance(publicKey)
        setTurBalance(balance)

        // Load NFT count
        const nfts = await checkinService.getUserNFTs(publicKey)
        setNftCount(nfts.length)
      } catch (error) {
        console.error('Error loading profile data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [publicKey])

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          👤 Mi Perfil
        </h1>
        <p className="text-gray-600">
          Conecta tu wallet para ver tu perfil.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        👤 Mi Perfil
      </h1>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-600">
            Dirección de Wallet
          </label>
          <p className="text-lg font-mono bg-gray-100 p-3 rounded mt-1">
            {publicKey}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">NFTs Coleccionados</p>
            <p className="text-2xl font-bold text-blue-600">
              {loading ? '...' : nftCount}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Balance TUR</p>
            <p className="text-2xl font-bold text-purple-600">
              {loading ? '...' : turBalance.toFixed(2)}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Lugares Visitados</p>
            <p className="text-2xl font-bold text-green-600">
              {loading ? '...' : nftCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
