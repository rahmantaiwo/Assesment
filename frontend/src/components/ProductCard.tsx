import { Link } from "react-router-dom";
import type { Product } from "../types";
import { useCart } from "../context/CartContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
      <Link to={`/products/${product.id}`}>
        <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
          <img
            src={product.image || "https://via.placeholder.com/300"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-bold text-lg mb-1 hover:text-blue-600 truncate">{product.name}</h3>
        </Link>
        <p className="text-gray-500 text-xs mb-2 uppercase tracking-wide">{product.category}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
          <button
            onClick={() => addToCart(product)}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
