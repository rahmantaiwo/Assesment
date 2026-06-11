import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { productService } from "../services/productService";
import type { Product } from "../types";
import { useCart } from "../context/CartContext";

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const data = await productService.getById(id);
        setProduct(data);
      } catch {
        setError("Product not found.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (isLoading) return <div className="text-center py-20">Loading product...</div>;
  if (error || !product) return <div className="text-center py-20 text-red-600">{error || "Product not found"}</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Products
      </button>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden grid md:grid-cols-2 gap-8">
        <div className="bg-gray-50 flex items-center justify-center p-8">
          <img
            src={product.image || "https://via.placeholder.com/600"}
            alt={product.name}
            className="max-w-full h-auto rounded-lg shadow-sm"
          />
        </div>
        
        <div className="p-8 flex flex-col">
          <div className="mb-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase tracking-wider">
              {product.category}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          <p className="text-2xl font-bold text-blue-600 mb-6">${product.price.toFixed(2)}</p>
          
          <div className="prose prose-sm text-gray-600 mb-8">
            <p>{product.description}</p>
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex items-center text-sm text-gray-500">
              <span className={`h-2 w-2 rounded-full mr-2 ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </div>
            
            <button
              disabled={product.stock <= 0}
              onClick={() => addToCart(product)}
              className="w-full py-4 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition transform active:scale-95"
            >
              Add to Shopping Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
