import { createContext, useState, useEffect, ReactNode } from 'react'
import { StellarWalletsKit, WalletNetwork, allowAllModules, FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit'

interface WalletContextType {
  publicKey: string | null
  isConnected: boolean
  isLoading: boolean
  connect: () => Promise<void>
  disconnect: () => void
  kit: StellarWalletsKit | null
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: ReactNode
}

// Initialize Stellar Wallets Kit
const kit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET,
  selectedWalletId: FREIGHTER_ID,
  modules: allowAllModules(),
})

export function WalletProvider({ children }: WalletProviderProps) {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Connect to wallet
  const connect = async () => {
    setIsLoading(true)

    try {
      await kit.openModal({
        onWalletSelected: async (option) => {
          try {
            kit.setWallet(option.id)
            const { address } = await kit.getAddress()
            
            setPublicKey(address)
            setIsConnected(true)
            localStorage.setItem('walletConnected', 'true')
            localStorage.setItem('walletAddress', address)
          } catch (error) {
            console.error('Error getting address:', error)
            alert('Error al conectar con la wallet')
          }
        },
      })
    } catch (error) {
      console.error('Error opening wallet modal:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Disconnect wallet
  const disconnect = () => {
    setPublicKey(null)
    setIsConnected(false)
    localStorage.removeItem('walletConnected')
    localStorage.removeItem('walletAddress')
  }

  // Auto-connect on mount if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected')
    const savedAddress = localStorage.getItem('walletAddress')
    
    if (wasConnected === 'true' && savedAddress) {
      setPublicKey(savedAddress)
      setIsConnected(true)
    }
  }, [])

  return (
    <WalletContext.Provider value={{ 
      publicKey,
      isConnected,
      isLoading,
      connect, 
      disconnect,
      kit
    }}>
      {children}
    </WalletContext.Provider>
  )
}
