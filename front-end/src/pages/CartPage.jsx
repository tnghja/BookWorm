import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { createOrder } from '@/api/order';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { useAuth } from '@/components/context/AuthContext';
import SignInForm from '@/components/SignInForm';
import { useCurrency } from '@/components/context/CurrencyContext'; 
import { useNavigate } from 'react-router-dom';

export default function CartPage() {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const updateItemPrice = useCartStore((state) => state.updateItemPrice);
  const [empty, setEmpty] = useState(false);
  const { isAuthenticated, checkAuthStatus, isInitialized, isLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null); // null | 'success' | 'error'
  const [orderMessage, setOrderMessage] = useState('');
  const [showSignIn, setShowSignIn] = useState(false);
  const { convertAndFormat } = useCurrency();
  const [quantityErrors, setQuantityErrors] = useState({});
  const [unavailableItems, setUnavailableItems] = useState([]);
  const [countdown, setCountdown] = useState(10);
  const [errorItems, setErrorItems] = useState([]);
  
  useEffect(() => {
    if (!isInitialized || isLoading) {
      return; // Don't proceed if auth isn't initialized yet
    }

    // Remove items with zero quantity
    items.forEach(item => {
      if (item.quantity === 0) {
        removeItem(item.id);
      }
    });
    
    // Update empty state based on items length
    setEmpty(items.length === 0);
  }, [items, removeItem, isInitialized, isLoading]);

  // Handle redirect after successful order
  useEffect(() => {
    let redirectTimer;
    let countdownTimer;
    
    if (orderStatus === 'success' && dialogOpen) {
      setCountdown(10);
      
      countdownTimer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
          }
          return prev - 1;
        });
      }, 1000);
      
      redirectTimer = setTimeout(() => {
        setDialogOpen(false);
        navigate('/');
      }, 10000);
    }
    
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [orderStatus, dialogOpen, navigate]);

  // Helper to get the effective price for an item (sale price or original price)
  const getItemPrice = (item) => {
    return item.salePrice !== null && item.salePrice !== undefined ? item.salePrice : item.originalPrice;
  };

  // Calculate item total
  const getItemTotal = (item) => {
    return getItemPrice(item) * item.quantity;
  };

  // Calculate totals
  const total = items.reduce((sum, item) => sum + getItemTotal(item), 0);

  const handleOrder = async () => {
    if (empty) {
      setOrderStatus('error');
      setOrderMessage(
        <div className="space-y-2">
          <p>Your cart is empty. Please add some books before placing an order.</p>
        </div>
      );
      setDialogOpen(true);
      return;
    }
    
    if (!isAuthenticated) {
      setShowSignIn(true);
      return;
    }
    
    const itemList = items.map(item => ({
      book_id: item.id,
      quantity: item.quantity,
      price: getItemPrice(item), // Fix: send individual item price, not the total
    }));
    
    try {
      const response = await createOrder(itemList);
      
      // Check if there are any errors in the response
      if (response?.errors && Object.keys(response.errors).length > 0) {
        setOrderStatus('warning');
        
        const errorMessages = [];
        const itemsWithErrors = [];
        
        // Handle each error type for each book
        Object.entries(response.errors).forEach(([bookId, error]) => {
          const bookIdNum = parseInt(bookId);
          const item = items.find(i => i.id === bookIdNum);
          
          if (item) {
            switch(error.type) {
              case 'book_not_found':
                errorMessages.push(`${item.title} is no longer available and will be removed from your cart.`);
                removeItem(bookIdNum);
                break;
                
              case 'price_changed':
                // Update the item price in the cart
                const newPrice = response.list_item.find(i => i.book_id === bookIdNum)?.price;
                if (newPrice !== undefined) {
                  errorMessages.push(`Price for ${item.title} has been updated to ${convertAndFormat(newPrice)}.`);
                  // Only update the price if it's actually different from what we have
                  if (Math.abs(getItemPrice(item) - newPrice) > 0.01) {
                    updateItemPrice(bookIdNum, newPrice);
                  }
                }
                break;
                
              case 'new_discount':
                // A new discount has been applied
                const discountPrice = response.list_item.find(i => i.book_id === bookIdNum)?.price;
                const regularPrice = error.regular_price;
                if (discountPrice !== undefined && regularPrice !== undefined) {
                  errorMessages.push(`Good news! ${item.title} is now on sale! Price updated from ${convertAndFormat(regularPrice)} to ${convertAndFormat(discountPrice)}.`);
                  updateItemPrice(bookIdNum, discountPrice, false);
                }
                break;
                
              case 'discount_expired':
                // Revert to the base price
                const basePrice = response.list_item.find(i => i.book_id === bookIdNum)?.price;
                if (basePrice !== undefined) {
                  errorMessages.push(`Discount for ${item.title} has expired. Price updated to the regular price ${convertAndFormat(basePrice)}.`);
                  updateItemPrice(bookIdNum, basePrice, true);
                }
                break;
            }
            
            itemsWithErrors.push(item.title);
          }
        });
        
        setErrorItems(itemsWithErrors);
        setOrderMessage(
          <div className="space-y-2">
            <p>There were some issues with your order:</p>
            {errorMessages.map((message, index) => (
              <p key={index}>{message}</p>
            ))}
            <p>Please review your cart before placing the order again.</p>
          </div>
        );
        setDialogOpen(true);
      } else {
        // Order successful
        setOrderStatus('success');
        setOrderMessage(
          <div className="space-y-2">
            <p>Order placed successfully!</p>
          </div>
        );
        clearCart();
        setDialogOpen(true);
      }
    } catch (error) {
      setOrderStatus('error');
      setOrderMessage(
        <div className="space-y-2">
          <p>{error?.message || 'Failed to place order. Please try again later.'}</p>
        </div>
      );
      setDialogOpen(true);
    }
  }

  const handleQuantityChange = (itemId, value) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      if (numValue === 0) {
        removeItem(itemId);
      } else if (numValue < 0) {
        updateQuantity(itemId, 1);
        setQuantityErrors(prev => ({...prev, [itemId]: 'Minimum quantity is 1'}));
      } else if (numValue > 8) {
        updateQuantity(itemId, 8);
        setQuantityErrors(prev => ({...prev, [itemId]: 'Maximum quantity is 8'}));
      } else {
        updateQuantity(itemId, numValue);
        setQuantityErrors(prev => {
          const newErrors = {...prev};
          delete newErrors[itemId];
          return newErrors;
        });
      }
    }
  };

  // Show loading state if auth isn't initialized yet
  if (!isInitialized || isLoading) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center">
        <div className="text-lg">Loading cart...</div>
      </div>
    );
  }

  return (
    <>
      {showSignIn && <SignInForm onLoginSuccess={() => checkAuthStatus()} />}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogTitle>
            {orderStatus === 'success' ? 'Order Success' : 
             orderStatus === 'warning' ? 'Cart Updated' : 'Order Failed'}
          </DialogTitle>
          <div className="my-4">
            {typeof orderMessage === 'string' ? <DialogDescription>{orderMessage}</DialogDescription> : orderMessage}
          </div>
          {orderStatus === 'success' && (
            <p className="text-sm text-gray-500 mt-2">Redirecting to home page in {countdown} seconds...</p>
          )}
          <DialogClose asChild>
            <button className="mt-4 px-4 py-2 bg-black text-white rounded" onClick={() => {
              setDialogOpen(false);
              if (orderStatus === 'success') {
                navigate('/');
              }
            }}>
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
                      onClick={() => navigate(`/product/${item.id}`)}
                    >
                      {/* Product & Info */}
                      <div className="col-span-2 flex gap-4 items-center">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-20 h-24 object-cover rounded bg-gray-100 flex-shrink-0"
                        />
                        <div>
                          <div className="font-medium text-lg line-clamp-2">{item.title}</div>
                          <div className="text-sm text-gray-600">{item.author}</div>
                        </div>
                      </div>
                      {/* Price */}
                      <div className="text-left">
                      {item.salePrice ? (
                        <>
                          <div className="text-lg text-red-500">{convertAndFormat(item.salePrice)}</div>
                          {item.originalPrice && (
                            <div className="text-xs text-gray-500 line-through mb-1">
                              {convertAndFormat(item.originalPrice)}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-lg text-black">{convertAndFormat(item.originalPrice)}</div>
                      )}
                      </div>
                      {/* Quantity Controls */}
                      <div className="flex flex-col justify-start">
                        <div className="flex items-center gap-2 border h-10 w-25 rounded">
                          <button
                            className="border px-2 h-10 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(item.id, item.quantity - 1);
                            }}
                            disabled={item.quantity < 1}
                          >
                            -
                          </button>
                          <input
                            className=" w-6 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            type="number"
                            value={item.quantity}
                            min={1}
                            max={8}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(item.id, e.target.value);
                            }}
                          />
                          <button
                            className="border h-10 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(item.id, item.quantity + 1);
                            }}
                            disabled={item.quantity >= 8}
                          >
                            +
                          </button>
                        </div>
                        {quantityErrors[item.id] && (
                          <p className="text-red-500 text-xs mt-1">{quantityErrors[item.id]}</p>
                        )}
                      </div>
                      {/* Total */}
                      <div className="text-left text-lg font-semibold">
                        {convertAndFormat(getItemTotal(item))}
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
                    className="rounded-lg shadow-sm border mb-4 p-2 bg-white grid grid-cols-4 gap-x-4 gap-y-2 items-center"
                >
                    {/* --- Row 1: Image | Title/Author --- */}
                    <div className="col-start-1 row-start-1 flex items-center justify-center"
                      onClick={() => navigate(`/product/${item.id}`)}>
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-16 h-20 object-cover rounded bg-gray-100" // Adjusted size
                        />
                    </div>
                    {/* Title & Author: Cols 2-4, Row 1 */}
                    <div className="col-start-2 col-span-3 row-start-1 items-center px-2"
                      onClick={() => navigate(`/product/${item.id}`)}> {/* Use self-center if parent items-center isn't enough */}
                        <div className="font-medium text-base">{item.title}</div>
                        <div className="text-sm text-gray-600">{item.author}</div>
                    </div>
                
                    {/* --- Row 2: Price Label | Price Value --- */}
                
                    {/* Price Label: Col 1, Row 2 */}
                    <div className="col-start-1 row-start-2 font-medium text-sm text-right pr-2">Price:</div>
                
                    {/* Price Value: Cols 2-4, Row 2 */}
                    <div className="col-start-2 col-span-3 row-start-2 flex items-center gap-2 px-2">
                        {item.salePrice ? (
                          <>
                            {item.originalPrice && (
                              <div className="text-xs text-gray-500 line-through">
                                {convertAndFormat(item.originalPrice)}
                              </div>
                            )}
                            <div className="text-base text-red-500">{convertAndFormat(item.salePrice)}</div>
                          </>
                        ) : (
                          <div className="text-base text-black">{convertAndFormat(item.originalPrice)}</div>
                        )}
                    </div>
                
                    {/* --- Row 3: Quantity Label | Quantity Controls --- */}
                
                    {/* Quantity Label: Col 1, Row 3 */}
                    <div className="col-start-1 row-start-3 font-medium text-sm text-right pr-2">Quantity:</div>
                
                    {/* Quantity Controls: Cols 2-4, Row 3 */}
                    <div className="col-start-2 col-span-3 row-start-3 flex flex-col">
                        <div className="flex items-center gap-1 border h-8 rounded w-28">
                            <button
                                className="border px-1 text-sm h-full w-8 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(item.id, item.quantity - 1);
                                }}
                                disabled={item.quantity < 1}
                            >
                                -
                            </button>
                            <input
                                className="w-12 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                type="number"
                                value={item.quantity}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(item.id, e.target.value);
                                }}
                                min={1}
                                max={8}
                            />
                            <button
                                className="border px-1 text-sm h-full w-8 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(item.id, item.quantity + 1);
                                }}
                                disabled={item.quantity >= 8}
                            >
                                +
                            </button>
                        </div>
                        {quantityErrors[item.id] && (
                          <p className="text-red-500 text-xs mt-1">{quantityErrors[item.id]}</p>
                        )}
                    </div>
                    <div className="col-start-1 row-start-4 font-medium text-sm text-right pr-2">Total:</div>
                
                    {/* Total Value: Cols 2-4, Row 4 */}
                    <div className="col-start-2 col-span-3 row-start-4 flex items-center px-2">
                        <div className="text-base font-semibold">
                            {convertAndFormat(getItemTotal(item))}
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
