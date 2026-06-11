import { useState, useEffect, useMemo } from "react";
import { productService } from "../services/productService";
import type { Product } from "../types";
import ProductCard from "../components/ProductCard";
import SearchFilter from "../components/SearchFilter";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const result = await productService.getAll({ limit: 100 }); // Fetch a larger batch for client-side filtering
        setProducts(result.data);
      } catch (err) {
        setError("Failed to load products. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                          product.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !category || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  if (error) return <div className="text-center text-red-600 py-10">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Our Products</h1>
      
      <SearchFilter 
        search={search} 
        setSearch={setSearch} 
        category={category} 
        setCategory={setCategory} 
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          No products found matching your criteria.
        </div>
      )}
    </div>
  );
}
