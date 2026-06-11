import { useCart } from "../context/CartContext";
import { useNavigate, Link } from "react-router-dom";

export default function Checkout() {
  const { items, total, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const handlePlaceOrder = () => {
    alert("Thank you for your order! Your purchase was successful.");
    clearCart();
    navigate("/products");
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link 
          to="/products" 
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center bg-white p-4 rounded-lg border shadow-sm">
              <img 
                src={item.image || "https://via.placeholder.com/100"} 
                alt={item.name} 
                className="w-20 h-20 object-cover rounded-md"
              />
              <div className="ml-4 flex-1">
                <h3 className="font-bold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.category}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium">Qty: {item.quantity}</span>
                  <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
              <button 
                onClick={() => removeFromCart(item.id)}
                className="ml-4 p-2 text-gray-400 hover:text-red-600 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
          
          <div className="flex justify-between items-center pt-4">
            <button 
              onClick={() => clearCart()}
              className="text-sm font-medium text-gray-500 hover:text-red-600 transition"
            >
              Clear Shopping Cart
            </button>
            <Link to="/products" className="text-sm font-medium text-blue-600 hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm h-fit sticky top-24">
          <h2 className="text-xl font-bold mb-6">Order Summary</h2>
          <div className="space-y-3 pb-6 border-b">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="text-green-600 font-medium">Free</span>
            </div>
          </div>
          <div className="py-6 flex justify-between items-center">
            <span className="text-lg font-bold">Total</span>
            <span className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</span>
          </div>
          <button 
            onClick={handlePlaceOrder}
            className="w-full py-4 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition shadow-lg active:scale-95"
          >
            Place Your Order
          </button>
          <p className="mt-4 text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
            Secure Checkout Guaranteed
          </p>
        </div>
      </div>
    </div>
  );
}
