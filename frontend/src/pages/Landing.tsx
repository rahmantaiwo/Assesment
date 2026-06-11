import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";
import { productService } from "../services/productService";
import type { Product } from "../types";

export default function Landing() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const result = await productService.getAll();
        setFeaturedProducts(result.data.slice(0, 4));
      } catch (error) {
        console.error("Failed to fetch featured products", error);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white rounded-[2rem] border shadow-sm px-6 py-16 md:py-28 text-center flex flex-col items-center justify-center">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/50 to-transparent -z-10" />
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10 mb-4">
            New Summer Collection 2026
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
            Elevate Your Lifestyle <br />
            <span className="text-blue-600">With Premium Goods.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Discover a curated selection of electronics, fashion, and home essentials. 
            Experience quality and speed with our world-class delivery service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              to="/products"
              className="px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 text-lg"
            >
              Shop All Products
            </Link>
            <Link
              to="/login"
              className="px-10 py-5 bg-white text-gray-900 font-bold rounded-2xl border-2 hover:bg-gray-50 transition-all active:scale-95 text-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: "Free Shipping", desc: "On all orders over $50", icon: "🚚" },
          { title: "Secure Payment", desc: "100% secure payment processing", icon: "🛡️" },
          { title: "24/7 Support", desc: "Our team is here to help anytime", icon: "💬" }
        ].map((feature) => (
          <div key={feature.title} className="p-8 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-start gap-4 hover:shadow-md transition">
            <span className="text-4xl">{feature.icon}</span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
              <p className="text-gray-500">{feature.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="space-y-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Arrivals</h2>
              <p className="text-gray-500 mt-2">Handpicked for you this week.</p>
            </div>
            <Link to="/products" className="text-blue-600 font-bold hover:underline">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div key={product.id} className="group flex flex-col bg-white border rounded-2xl overflow-hidden hover:shadow-lg transition">
                <Link to={`/products/${product.id}`} className="relative h-64 overflow-hidden bg-gray-100">
                  <img 
                    src={product.image || "https://via.placeholder.com/400"} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                </Link>
                <div className="p-5 space-y-2">
                  <Link to={`/products/${product.id}`}>
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition truncate">{product.name}</h3>
                  </Link>
                  <p className="text-sm text-gray-500 uppercase tracking-wider">{product.category}</p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
                    <button 
                      onClick={() => addToCart(product)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 100-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories Spotlight */}
      <section className="space-y-10">
        <h2 className="text-3xl font-bold text-gray-900 text-center">Shop by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'Electronics', img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=600' },
            { name: 'Clothing', img: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=600' },
            { name: 'Home', img: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&q=80&w=600' }
          ].map((cat) => (
            <Link 
              key={cat.name} 
              to={`/products?category=${cat.name}`}
              className="group relative h-80 overflow-hidden rounded-[2rem] border shadow-sm"
            >
              <div className="absolute inset-0 bg-gray-900/10 group-hover:bg-gray-900/30 transition-colors z-10" />
              <div className="absolute bottom-8 left-8 z-20">
                <h3 className="text-3xl font-bold text-white mb-2">{cat.name}</h3>
                <span className="inline-flex items-center text-white font-semibold group-hover:gap-2 transition-all">
                  Browse Collection <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">→</span>
                </span>
              </div>
              <img 
                src={cat.img} 
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-gray-900 text-white rounded-[2rem] px-8 py-16 md:py-24 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold">Ready to start shopping?</h2>
          <p className="text-gray-400 text-lg">Join thousands of happy customers who shop with us every day. Quality products, exceptional service.</p>
          <div className="pt-4">
            <Link
              to="/products"
              className="px-8 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition inline-block"
            >
              Explore Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
