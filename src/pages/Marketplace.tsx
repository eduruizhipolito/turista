import { useState, useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { marketplaceService } from '@/services/marketplace.service'
import { balanceService } from '@/services/balance.service'
import { PRODUCTS } from '@/data/products'
import { IProduct } from '@/types'

export default function Marketplace() {
  const { publicKey, isConnected, kit } = useWallet()
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const [useDiscount, setUseDiscount] = useState(false)
  const [balances, setBalances] = useState({ xlm: 0, tur: 0 })
  const [loadingBalances, setLoadingBalances] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; txHash?: string } | null>(null)

  useEffect(() => {
    if (selectedProduct && publicKey) {
      loadBalances()
    }
  }, [selectedProduct, publicKey])

  const loadBalances = async () => {
    if (!publicKey) return
    
    setLoadingBalances(true)
    try {
      const userBalances = await balanceService.getBalances(publicKey)
      setBalances(userBalances)
    } catch (error) {
      console.error('Error loading balances:', error)
    } finally {
      setLoadingBalances(false)
    }
  }

  const handlePurchase = async (product: IProduct, withDiscount: boolean) => {
    if (!isConnected || !publicKey || !kit) {
      setToast({ message: 'Please connect your wallet first', type: 'error' })
      return
    }

    setPurchasing(true)

    try {
      let result
      if (withDiscount) {
        // Check if we need to approve first
        console.log('🔍 Checking allowance...')
        const currentAllowance = await marketplaceService.checkAllowance(publicKey)
        
        if (currentAllowance < product.priceDiscountTUR) {
          console.log('⚠️ Insufficient allowance, requesting approval...')
          setToast({ 
            message: 'Approving marketplace to burn TUR tokens...', 
            type: 'success' 
          })
          
          // Request approval for a large amount (e.g., 100,000 TUR) to avoid multiple approvals
          const approveResult = await marketplaceService.approveTUR(
            kit,
            publicKey,
            100000 // Approve 100k TUR tokens
          )
          
          if (!approveResult.success) {
            setToast({ message: `Approval error: ${approveResult.error}`, type: 'error' })
            return
          }
          
          console.log('✅ Approval successful!')
          setToast({ 
            message: '✅ Approval successful. Processing purchase...', 
            type: 'success' 
          })
        }
        
        result = await marketplaceService.purchaseWithDiscount(
          kit,
          publicKey,
          product.merchantAddress,
          product.priceDiscountXLM,
          product.priceDiscountTUR
        )
      } else {
        result = await marketplaceService.purchaseWithXLM(
          kit,
          publicKey,
          product.merchantAddress,
          product.priceXLM
        )
      }

      if (result.success) {
        setToast({ 
          message: `Successfully purchased ${product.name}!`, 
          type: 'success',
          txHash: result.txHash
        })
        setSelectedProduct(null)
        
        // Reload balances after successful purchase
        await loadBalances()
      } else {
        setToast({ message: `Error: ${result.error}`, type: 'error' })
      }
    } catch (error) {
      console.error('Purchase error:', error)
      setToast({ message: 'Purchase error. Please try again.', type: 'error' })
    } finally {
      setPurchasing(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-3xl font-bold mb-4">🛒 Marketplace</h1>
          <p className="text-gray-600 mb-6">
            Connect your wallet to buy products and services
          </p>
          <div className="text-6xl mb-4">🔒</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🛒 Marketplace</h1>
        <p className="text-gray-600">
          Buy with XLM or use your TUR tokens to get discounts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative h-48">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Product'
                }}
              />
              <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {product.category}
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{product.description}</p>

              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Vendedor: {product.merchantName}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Precio normal:</span>
                  <span className="font-bold text-blue-600">{product.priceXLM} XLM</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">With TUR discount:</span>
                    <span className="text-xs text-gray-500">{product.priceDiscountTUR} TUR</span>
                  </div>
                  <span className="font-bold text-green-600">{product.priceDiscountXLM} XLM</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedProduct(product)
                    setUseDiscount(false)
                  }}
                  disabled={purchasing}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Buy with XLM
                </button>

                <button
                  onClick={() => {
                    setSelectedProduct(product)
                    setUseDiscount(true)
                  }}
                  disabled={purchasing}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Buy with Discount
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de confirmación */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Confirm Purchase</h2>
            
            <div className="mb-6">
              <p className="font-semibold mb-2">{selectedProduct.name}</p>
              <p className="text-sm text-gray-600 mb-4">{selectedProduct.description}</p>
              
              {/* Balances del usuario */}
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Your balance:</p>
                {loadingBalances ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : (
                  <div className="flex gap-4">
                    <div>
                      <p className="text-sm">
                        <span className="font-bold text-blue-600">{balances.xlm.toFixed(2)}</span> XLM
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-bold text-green-600">{balances.tur.toFixed(0)}</span> TUR
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {useDiscount ? (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="font-semibold text-green-800 mb-2">With TUR Discount</p>
                  <p className="text-sm">You'll pay: <span className="font-bold">{selectedProduct.priceDiscountXLM} XLM</span></p>
                  <p className="text-sm">You'll spend: <span className="font-bold">{selectedProduct.priceDiscountTUR} TUR</span></p>
                  
                  {/* Validación de saldo */}
                  {!loadingBalances && (
                    <>
                      {balances.xlm < selectedProduct.priceDiscountXLM && (
                        <p className="text-xs text-red-600 mt-2">⚠️ Insufficient XLM</p>
                      )}
                      {balances.tur < selectedProduct.priceDiscountTUR && (
                        <p className="text-xs text-red-600 mt-2">⚠️ Insufficient TUR</p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-semibold text-blue-800 mb-2">Regular Price</p>
                  <p className="text-sm">You'll pay: <span className="font-bold">{selectedProduct.priceXLM} XLM</span></p>
                  
                  {/* Validación de saldo */}
                  {!loadingBalances && balances.xlm < selectedProduct.priceXLM && (
                    <p className="text-xs text-red-600 mt-2">⚠️ XLM insuficiente</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedProduct(null)}
                disabled={purchasing}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePurchase(selectedProduct, useDiscount)}
                disabled={
                  purchasing ||
                  loadingBalances ||
                  (useDiscount
                    ? balances.xlm < selectedProduct.priceDiscountXLM || balances.tur < selectedProduct.priceDiscountTUR
                    : balances.xlm < selectedProduct.priceXLM)
                }
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {purchasing ? '⏳ Purchasing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
          <div className={`${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white px-6 py-4 rounded-lg shadow-2xl min-w-[300px] max-w-md`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{toast.type === 'success' ? '✅' : '❌'}</span>
              <p className="flex-1 font-medium">{toast.message}</p>
              <button
                onClick={() => setToast(null)}
                className="text-white/80 hover:text-white text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            {toast.type === 'success' && toast.txHash && (
              <div className="ml-9">
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${toast.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/90 hover:text-white underline inline-flex items-center gap-1"
                >
                  Ver detalles ↗️
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
