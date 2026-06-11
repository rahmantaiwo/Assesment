import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "../pages/Landing";
import Products from "../pages/Products";
import ProductDetails from "../pages/ProductDetails";
import ProductForm from "../pages/ProductForm";
import Login from "../pages/Login";
import Checkout from "../pages/Checkout";
import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes */}
      <Route 
        path="/admin/products/new" 
        element={
          <ProtectedRoute>
            <ProductForm />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/products/edit/:id" 
        element={
          <ProtectedRoute>
            <ProductForm />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/checkout" 
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  );
}
