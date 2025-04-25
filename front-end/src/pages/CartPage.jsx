import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { createOrder } from '@/api/order';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { useAuth } from '@/components/context/AuthContext';
import SignInForm from '@/components/SignInForm'; 
export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const [empty, setEmpty] = useState(false);
  const { isAuthenticated , checkAuthStatus} = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null); // null | 'success' | 'error'
  const [orderMessage, setOrderMessage] = useState('');
  const [showSignIn, setShowSignIn] = useState(false);
  // Remove items with quantity 0 automatically
  useEffect(() => {
    items.forEach(item => {
      if (item.quantity === 0) {
        removeItem(item.id);
      }
    });
    if (items.length === 0) {
      setEmpty(true);
    }
  }, [items, removeItem, clearCart]);

  // // Calculate totals
  const total = items.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0);

  const handleOrder = async () => {
    if (!isAuthenticated) {
      setOrderStatus('error');
      setOrderMessage('Please log in to place an order.');
      return;
    }
    const itemList = items.map(item => ({
      book_id: item.id,
      quantity: item.quantity,
      price: item.salePrice,
    }));
    try {
      await createOrder(itemList);
      setOrderStatus('success');
      setOrderMessage('Order placed successfully!');
      clearCart();
    } catch (error) {
      setOrderStatus('error');
      setOrderMessage(error?.message || 'Failed to place order.');
    }
    setDialogOpen(true);
  }

  return (
    <>
      {showSignIn && <SignInForm onLoginSuccess={() => checkAuthStatus()}/>}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogTitle>{orderStatus === 'success' ? 'Order Success' : 'Order Failed'}</DialogTitle>
          <DialogDescription>{orderMessage}</DialogDescription>
          <DialogClose asChild>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setDialogOpen(false)}>
              Close
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>
      <div className="container w-full mx-auto p-4">
      <h1 className="text-lg mb-6">Your cart: {items.length} items</h1>
      <hr className="my-8 border-gray-400" />
      <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
        <div className="col-span-5 border-2 p-4">
          <div className="grid grid-cols-5 border-b pb-2">
            <div className="col-span-2">Product</div>
            <div className="text-left">Price</div>
            <div className="text-left">Quantity</div>
            <div className="text-left">Total</div>
          </div>
          {empty ? (
            <div className="container w-full mx-auto p-4">
              <h1 className="text-lg mb-6">Your cart is empty</h1>
            </div>
          ) : (
            <div className="py-6">
              {items.map((item) => (
                <div className="grid grid-cols-5 items-center mb-4" key={item.id}>
                  <div className="flex gap-4 col-span-2">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-20 h-24 object-cover rounded bg-gray-100"
                    />
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-gray-600">{item.author}</div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div>${item.totalPrice}</div>
                    {item.originalPrice && (
                      <div className="text-sm text-gray-500 line-through">
                        ${item.originalPrice}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-start">
                    <div className="flex justify-between items-center gap-2 w-25 border h-10">
                      <button
                        className="border px-2 h-10 w-10 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        disabled={item.quantity <= 0}
                      >
                        -
                      </button>
                      <input
                        className="w-8 text-center"
                        type="number"
                        value={item.quantity}
                        min={1}
                        max={8}
                        readOnly
                        disabled={item.quantity >= 8}
                      />
                      <button
                        className="border h-10 px-2 w-10 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => updateQuantity(item.id, Math.min(8, item.quantity + 1))}
                        disabled={item.quantity >= 8}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-left">
                    {(item.totalPrice * item.quantity).toFixed(2) || 'null'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="col-span-2 border rounded min-h-50">
          <h2 className="text-center mb-4 border-2 bg-gray-200 h-8">Cart Totals</h2>
          <div className="p-6">
            <div className="text-3xl font-bold text-center mb-4">${total.toFixed(2)}</div>
            <button className="w-full bg-gray-200 py-2 rounded" onClick={() => handleOrder()}>
              Place order
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
);
}
