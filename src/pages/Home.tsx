import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PLACES } from '@/data/places';
import { PRODUCTS } from '@/data/products';
import PlaceCard from '@/components/PlaceCard';
import ProductCard from '@/components/ProductCard';

const MACHU_PICCHU_IMG = 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1600&h=900&fit=crop';

export default function Home() {
  const [demoMode, setDemoMode] = useState(true); // Modo demo activado por defecto

  return (
    <div>
      {/* Hero Section */}
      <div className="relative h-96 bg-cover bg-center" style={{ backgroundImage: `url(${MACHU_PICCHU_IMG})` }}>
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <h1 className="text-5xl font-bold text-white text-center">Descubre Latinoamérica</h1>
        </div>
      </div>

      {/* Controles */}
      {/* <div className="bg-white border-b p-4 flex items-center justify-end">
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

      {/* Place Gallery */}
      <div className="p-4 md:p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Lugares Turísticos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {PLACES.map((place) => (
            <PlaceCard key={place.id} place={place} demoMode={demoMode} />
          ))}
        </div>
      </div>

      {/* Products Gallery */}
      <div className="p-4 md:p-8 bg-gray-50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Beneficios para Turistas</h2>
          <Link 
            to="/marketplace"
            className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center gap-1"
          >
            Ver todos →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <Link 
        to="/check-in"
        className="md:hidden fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg font-semibold flex items-center gap-2"
      >
        📍 Haz Check-in
      </Link>
    </div>
  );
}
