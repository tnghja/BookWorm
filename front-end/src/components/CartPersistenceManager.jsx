import { useEffect, useContext } from 'react';
import { useCartStore } from '@/store/cartStore';
import { AuthContext } from '@/components/context/AuthContext';

const GUEST_CART_KEY = 'cart-guest';

const loadCartFromStorage = (key) => {
  if (!key || typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const saveCartToStorage = (key, items) => {
  if (!key || typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items || []));
  } catch (e) { }
};

const mergeCarts = (userItems = [], guestItems = []) => {
  userItems = Array.isArray(userItems) ? userItems : [];
  guestItems = Array.isArray(guestItems) ? guestItems : [];

  if (!guestItems.length) return userItems;

  const itemMap = new Map(userItems.map(item => [item.id, { ...item }]));

  guestItems.forEach(item => {
    if (!item || typeof item.id === 'undefined' || typeof item.quantity === 'undefined') {
      return;
    }
    const id = item.id;
    const qty = Number(item.quantity) || 0;
    if (itemMap.has(id)) {
      const existing = itemMap.get(id);
      // Ensure total quantity does not exceed 8
      existing.quantity = Math.min(8, (Number(existing.quantity) || 0) + qty);
    } else {
      // Also cap at 8 if guest item alone exceeds
      itemMap.set(id, { ...item, quantity: Math.min(8, qty) });
    }
  });
  return Array.from(itemMap.values());
};

export default function CartPersistenceManager() {
  const { user, prevUser, isLoading, isInitialized } = useContext(AuthContext);
  const setItems = useCartStore(state => state.setItems);

  useEffect(() => {
    if (isLoading || !isInitialized) {
      return;
    }

    const userId = user?.id;
    const prevUserId = prevUser?.id;
    const getStorageKey = (id) => id ? `cart-${id}` : GUEST_CART_KEY;

    const currentCartInStore = useCartStore.getState().items;
    let targetCartState = null;

    if (!userId) {
      if (prevUserId) {
        const prevUserKey = getStorageKey(prevUserId);
        saveCartToStorage(prevUserKey, currentCartInStore);
      }
      targetCartState = loadCartFromStorage(GUEST_CART_KEY);
    }
    else if (userId && !prevUserId) {
      const currentKey = getStorageKey(userId);
      const userCart = loadCartFromStorage(currentKey);
      const guestCart = loadCartFromStorage(GUEST_CART_KEY);

      if (guestCart && guestCart.length > 0) {
        const merged = mergeCarts(userCart, guestCart);
        saveCartToStorage(currentKey, merged);
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify([]));
        targetCartState = merged;
      } else {
        targetCartState = userCart;
      }
    }
    else {
      // targetCartState = currentCartInStore;
    }
   
    if (targetCartState !== null) {
      setItems(targetCartState);
    }
  }, [isLoading, isInitialized, user, prevUser, setItems]);

  useEffect(() => {
    if (isLoading || !isInitialized) {
      return () => { };
    }

    const userId = user?.id;
    const storageKey = userId ? `cart-${userId}` : GUEST_CART_KEY;

    const currentItems = useCartStore.getState().items;
    if (currentItems && currentItems.length > 0) {
      saveCartToStorage(storageKey, currentItems);
    }

    const unsubscribe = useCartStore.subscribe(state => {
      saveCartToStorage(storageKey, state.items);
    });

    return () => {
      unsubscribe();
    };
  }, [isLoading, isInitialized, user]);

  return null;
}