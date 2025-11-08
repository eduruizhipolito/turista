import { useWallet } from '@/hooks/useWallet'
import { useEffect, useState } from 'react'
import { balanceService } from '@/services/balance.service'
import { checkinService } from '@/services/checkin.service'
import { PRODUCTS } from '@/data/products'

export default function Profile() {
  const { publicKey, isConnected } = useWallet()
  const [xlmBalance, setXlmBalance] = useState<number>(0)
  const [turBalance, setTurBalance] = useState<number>(0)
  const [nftCount, setNftCount] = useState<number>(0)
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Función para abreviar direcciones de wallet
  const abbreviateAddress = (address: string, startChars = 8, endChars = 8) => {
    if (address.length <= startChars + endChars) return address
    return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`
  }

  useEffect(() => {
    if (!publicKey) return

    const loadData = async () => {
      setLoading(true)
      setLoadingHistory(true)
      try {
        // Load balances (XLM and TUR)
        const balances = await balanceService.getBalances(publicKey)
        setXlmBalance(balances.xlm)
        setTurBalance(balances.tur)

        // Load NFT count
        const nfts = await checkinService.getUserNFTs(publicKey)
        setNftCount(nfts.length)

        // Load purchase history
        const history = await balanceService.getPurchaseHistory(publicKey)
        setPurchaseHistory(history)
      } catch (error) {
        console.error('Error loading profile data:', error)
      } finally {
        setLoading(false)
        setLoadingHistory(false)
      }
    }

    loadData()
  }, [publicKey])

  if (!isConnected || !publicKey) {
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
          <div className="bg-gray-100 p-3 rounded mt-1">
            <p className="text-lg font-mono hidden md:block">
              {publicKey}
            </p>
            <p className="text-base font-mono md:hidden">
              {abbreviateAddress(publicKey)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Balance XLM</p>
            <p className="text-2xl font-bold text-blue-600">
              {loading ? '...' : xlmBalance.toFixed(2)}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Balance TUR</p>
            <p className="text-2xl font-bold text-purple-600">
              {loading ? '...' : turBalance.toFixed(2)}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">NFTs Coleccionados</p>
            <p className="text-2xl font-bold text-green-600">
              {loading ? '...' : nftCount}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Compras Realizadas</p>
            <p className="text-2xl font-bold text-orange-600">
              {loadingHistory ? '...' : purchaseHistory.length}
            </p>
          </div>
        </div>

        {/* Purchase History */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            💳 Historial de Compras
          </h2>
          
          {loadingHistory ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Cargando historial...</p>
            </div>
          ) : purchaseHistory.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500">Aún no has realizado ninguna compra</p>
            </div>
          ) : (
            <div className="space-y-3">
              {purchaseHistory.map((purchase) => {
                // Debug: Log para ver qué estamos buscando
                console.log('Buscando producto para:', {
                  merchant: purchase.to,
                  amountXLM: purchase.amountXLM,
                  hasDiscount: purchase.hasDiscount
                })
                
                // Buscar el producto basado en el merchant address Y el monto XLM
                const product = PRODUCTS.find(p => {
                  console.log('Comparando con:', {
                    name: p.name,
                    merchant: p.merchantAddress,
                    priceXLM: p.priceXLM,
                    priceDiscountXLM: p.priceDiscountXLM
                  })
                  
                  if (p.merchantAddress !== purchase.to) return false
                  
                  // Si tiene descuento, comparar con priceDiscountXLM
                  if (purchase.hasDiscount) {
                    const match = Math.abs(p.priceDiscountXLM - purchase.amountXLM) < 0.01
                    console.log('Comparando descuento:', p.priceDiscountXLM, 'vs', purchase.amountXLM, '=', match)
                    return match
                  }
                  // Si no tiene descuento, comparar con priceXLM
                  const match = Math.abs(p.priceXLM - purchase.amountXLM) < 0.01
                  console.log('Comparando normal:', p.priceXLM, 'vs', purchase.amountXLM, '=', match)
                  return match
                })
                
                console.log('Producto encontrado:', product?.name || 'NO ENCONTRADO')
                
                // Si no se encuentra el producto, intentar buscar solo por merchant
                const fallbackProduct = !product ? PRODUCTS.find(p => p.merchantAddress === purchase.to) : null
                
                const productName = product?.name || fallbackProduct?.name || `Compra de ${purchase.amountXLM.toFixed(2)} XLM`
                const merchantName = product?.merchantName || fallbackProduct?.merchantName || 'Comerciante'
                
                return (
                  <div key={purchase.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🛒</span>
                          <div>
                            <p className="font-semibold text-gray-800">
                              Compra realizada - {productName}
                            </p>
                            <p className="text-xs text-gray-500">{merchantName}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          {new Date(purchase.created_at).toLocaleString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {purchase.hasDiscount && (
                          <div className="mt-2">
                            <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                              ✨ Compra con dscto.
                            </span>
                          </div>
                        )}                        
                      </div>
                      <div className="text-right">
                        <div className="space-y-1">
                          <p className="text-xl font-bold text-blue-600">
                            {purchase.amountXLM.toFixed(2)} XLM
                          </p>
                          {purchase.hasDiscount && purchase.amountTUR > 0 && (
                            <p className="text-sm font-semibold text-purple-600">
                              + {purchase.amountTUR.toFixed(0)} TUR
                            </p>
                          )}
                          {purchase.hasDiscount && purchase.amountTUR === 0 && (
                            <p className="text-xs text-purple-500">
                              + TUR tokens
                            </p>
                          )}
                        </div>
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${purchase.transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:text-blue-700 underline mt-2 inline-block"
                        >
                          Ver en blockchain ↗️
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
