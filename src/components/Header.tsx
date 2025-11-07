import { Link } from 'react-router-dom'
import { useWallet } from '@/hooks/useWallet'

export default function Header() {
  const { publicKey, isConnected, isLoading, connect, disconnect } = useWallet()

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🗺️</span>
            <span className="text-2xl font-bold">Turista</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-blue-200 transition">
              Mapa
            </Link>
            <Link to="/collection" className="hover:text-blue-200 transition">
              Mi Colección
            </Link>
            <Link to="/marketplace" className="hover:text-blue-200 transition">
              Marketplace
            </Link>
            <Link to="/profile" className="hover:text-blue-200 transition">
              Perfil
            </Link>
          </nav>

          {/* Wallet Connection */}
          <div>
            {isConnected && publicKey ? (
              <div className="flex items-center space-x-3">
                <span className="hidden sm:inline bg-white/20 px-3 py-1 rounded-lg text-sm">
                  {formatAddress(publicKey)}
                </span>
                <button
                  onClick={disconnect}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
                >
                  Desconectar
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isLoading}
                className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {isLoading ? 'Conectando...' : 'Conectar Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
