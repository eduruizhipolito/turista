import { IProduct } from '@/types';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: IProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      <div className="relative">
        <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
        <div className="absolute top-2 right-2">
          <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
            {product.category}
          </span>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg mb-2 text-gray-800">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500">Precio</p>
            <p className="text-lg font-bold text-blue-600">{product.priceXLM} XLM</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Con descuento</p>
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold text-purple-600">{product.priceDiscountXLM} XLM</p>
              <span className="text-xs text-purple-600">+ {product.priceDiscountTUR} TUR</span>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-xs text-gray-500">Vendedor</p>
          <p className="text-sm font-medium text-gray-700">{product.merchantName}</p>
        </div>

        <Link
          to="/marketplace"
          className="w-full block text-center py-2 px-4 rounded font-medium text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-colors mt-auto"
        >
          Ver en Marketplace
        </Link>
      </div>
    </div>
  );
}
