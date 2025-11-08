import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '@/hooks/useWallet'

export default function Header() {
  const { publicKey, isConnected, isLoading, connect, disconnect } = useWallet()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const navLinks = (
    <>
      <Link to="/check-in" className="text-purple-700 hover:text-purple-900 font-medium transition block py-2 md:py-0">Check-in</Link>
      <Link to="/collection" className="text-purple-700 hover:text-purple-900 font-medium transition block py-2 md:py-0">Mi Colección</Link>
      <Link to="/marketplace" className="text-purple-700 hover:text-purple-900 font-medium transition block py-2 md:py-0">Marketplace</Link>
      <Link to="/profile" className="text-purple-700 hover:text-purple-900 font-medium transition block py-2 md:py-0">Perfil</Link>
    </>
  )

  return (
    <header className="bg-white text-gray-800 shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img 
              src="/logos/logo.png" 
              alt="Turista Logo" 
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks}
          </nav>

          {/* Wallet & Mobile Menu Button */}
          <div className="flex items-center">
            <div className="hidden md:block">
              {isConnected && publicKey ? (
                <div className="flex items-center space-x-3">
                  <span className="hidden sm:inline bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm font-medium">
                    {formatAddress(publicKey)}
                  </span>
                  <button
                    onClick={disconnect}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    Desconectar
                  </button>
                </div>
              ) : (
                <button
                  onClick={connect}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {isLoading ? 'Conectando...' : 'Conectar Wallet'}
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden ml-4 text-purple-700" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4">
            <nav className="flex flex-col space-y-2 mb-4">
              {navLinks}
            </nav>
            <div className="md:hidden">
              {isConnected && publicKey ? (
                <div className="flex items-center justify-between">
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm font-medium">
                    {formatAddress(publicKey)}
                  </span>
                  <button
                    onClick={disconnect}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    Desconectar
                  </button>
                </div>
              ) : (
                <button
                  onClick={connect}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 w-full py-2 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {isLoading ? 'Conectando...' : 'Conectar Wallet'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
