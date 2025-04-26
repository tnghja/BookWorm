import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { createOrder } from '@/api/order';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { useAuth } from '@/components/context/AuthContext';
import SignInForm from '@/components/SignInForm';
import { useCurrency } from '@/components/context/CurrencyContext'; 
export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const [empty, setEmpty] = useState(false);
  const { isAuthenticated, checkAuthStatus } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null); // null | 'success' | 'error'
  const [orderMessage, setOrderMessage] = useState('');
  const [showSignIn, setShowSignIn] = useState(false);
  const { convertAndFormat } = useCurrency();
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

  // Calculate totals
  const total = items.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0);

  const handleOrder = async () => {
    if (!isAuthenticated) {
      setShowSignIn(true);
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
      {showSignIn && <SignInForm onLoginSuccess={() => checkAuthStatus()} />}
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
        <div className="flex flex-col justify-center md:grid md:grid-cols-7 md:gap-6">
          <div className="col-span-5 border-2 p-4">
            {/* Desktop Table/Grid (md and up) */}
            <div className="hidden md:block">
              <div className="grid grid-cols-5 border-b pb-2 font-semibold">
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
                    <div
                      key={item.id}
                      className="grid grid-cols-5 items-center mb-4"
                    >
                      {/* Product & Info */}
                      <div className="col-span-2 flex gap-4 items-center">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-20 h-24 object-cover rounded bg-gray-100 flex-shrink-0"
                        />
                        <div>
                          <div className="font-medium text-lg">{item.title}</div>
                          <div className="text-sm text-gray-600">{item.author}</div>
                        </div>
                      </div>
                      {/* Price */}
                      <div className="text-left">
                        {item.originalPrice && (
                          <div className="text-xs text-gray-500 line-through mb-1">
                            {convertAndFormat(item.originalPrice)}
                          </div>
                        )}
                        <div className="text-lg text-red-500">{convertAndFormat(item.totalPrice)}</div>
                      </div>
                      {/* Quantity Controls */}
                      <div className="flex justify-start">
                        <div className="flex items-center gap-2 border h-10 px-2 w-25 rounded">
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
                      {/* Total */}
                      <div className="text-left text-lg font-semibold">
                        {convertAndFormat(item.totalPrice * item.quantity) || 'null'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Mobile Card/List (below md) */}
            <div className="block md:hidden">
              {empty ? (
                <div className="container w-full mx-auto p-4">
                  <h1 className="text-lg mb-6">Your cart is empty</h1>
                </div>
              ) : (
                <div className="py-6">
                  {items.map((item) => (
                    <div
                    key={item.id}
                    // Define the 4-column grid. Rows can be sized automatically or set explicitly.
                    // items-center vertically aligns content within each cell.
                    className="rounded-lg shadow-sm border mb-4 p-2 bg-white grid grid-cols-4 gap-x-4 gap-y-2 items-center"
                >
                    {/* --- Row 1: Image | Title/Author --- */}
                    <div className="col-start-1 row-start-1 flex items-center justify-center">
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-16 h-20 object-cover rounded bg-gray-100" // Adjusted size
                        />
                    </div>
                    {/* Title & Author: Cols 2-4, Row 1 */}
                    <div className="col-start-2 col-span-3 row-start-1 items-center px-2"> {/* Use self-center if parent items-center isn't enough */}
                        <div className="font-medium text-base">{item.title}</div>
                        <div className="text-sm text-gray-600">{item.author}</div>
                    </div>
                
                    {/* --- Row 2: Price Label | Price Value --- */}
                
                    {/* Price Label: Col 1, Row 2 */}
                    <div className="col-start-1 row-start-2 font-medium text-sm text-right pr-2">Price:</div>
                
                    {/* Price Value: Cols 2-4, Row 2 */}
                    <div className="col-start-2 col-span-3 row-start-2 flex items-center gap-2 px-2">
                        {item.originalPrice && (
                            <div className="text-xs text-gray-500 line-through">
                                {convertAndFormat(item.originalPrice)}
                            </div>
                        )}
                        <div className="text-base text-red-500">{convertAndFormat(item.totalPrice)}</div>
                    </div>
                
                    {/* --- Row 3: Quantity Label | Quantity Controls --- */}
                
                    {/* Quantity Label: Col 1, Row 3 */}
                    <div className="col-start-1 row-start-3 font-medium text-sm text-right pr-2">Quantity:</div>
                
                    {/* Quantity Controls: Cols 2-4, Row 3 */}
                    <div className="col-start-2 col-span-3 row-start-3 flex items-center px-2">
                        <div className="flex items-center gap-1 border h-8 px-1 rounded">
                            <button
                                className="border px-1 text-sm h-full w-8 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                                disabled={item.quantity <= 0}
                            >
                                -
                            </button>
                            <input
                                className="w-8 text-center text-sm"
                                type="text"
                                value={item.quantity}
                                readOnly
                            />
                            <button
                                className="border px-1 text-sm h-full w-8 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => updateQuantity(item.id, Math.min(8, item.quantity + 1))}
                                disabled={item.quantity >= 8}
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <div className="col-start-1 row-start-4 font-medium text-sm text-right pr-2">Total:</div>
                
                    {/* Total Value: Cols 2-4, Row 4 */}
                    <div className="col-start-2 col-span-3 row-start-4 flex items-center px-2">
                        <div className="text-base font-semibold">
                            {convertAndFormat(item.totalPrice * item.quantity) || convertAndFormat('0.00')}
                        </div>
                    </div>
                
                </div>
                  ))}
                    </div>
                  )}
                </div>

          </div>
          <div className="md:col-span-2 border rounded min-h-50">
            <h2 className="text-center mb-4 border-2 bg-gray-200 h-8">Cart Totals</h2>
            <div className="p-6">
              <div className="text-3xl font-bold text-center mb-4">{convertAndFormat(total)}</div>
              <button className="w-full bg-gray-200 py-2 rounded" onClick={() => handleOrder()}>
                Place order
              </button>
            </div>
          </div>
        </div>
      </div>

      <SignInForm
  open={showSignIn}
  onOpenChange={setShowSignIn}
/>
    </>
  );
}
