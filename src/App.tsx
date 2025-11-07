import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WalletProvider } from './providers/WalletProvider'
import Layout from './components/Layout'
import MapView from './pages/MapView'
import Collection from './pages/Collection'
import Marketplace from './pages/Marketplace'
import Profile from './pages/Profile'

function App() {
  return (
    <WalletProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<MapView />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Layout>
      </Router>
    </WalletProvider>
  )
}

export default App
