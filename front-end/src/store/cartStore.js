import { create } from 'zustand';

// Define the store
export const useCartStore = create((set, get) => ({
  // State
  items: [], // Array to hold items like { id, name, price, quantity }
  setItems: (newItems) => {
    if (Array.isArray(newItems)) {
      set({ items: newItems });
    } else {
      console.warn("setItems received non-array value:", newItems);
      set({ items: [] }); // Reset to empty array if invalid input
    }
  },
  // Actions - functions to modify the state
  addItem: (book, quantity) => {
    const { items } = get(); // Get current items array from state
    const existingItem = items.find((item) => item.id === book.id);
    
    if (existingItem) {
      // If item already exists, increment quantity
      set((state) => ({
        items: state.items.map((item) =>
          item.id === book.id
            ? { ...item, quantity: Math.min(8, item.quantity + quantity) }
            : item
        ),
      }));
    } else {
      // If item is new, add it to the array with quantity 1
      set((state) => ({
        items: [...state.items, { ...book, quantity: 1 }],
      }));
    }
    
  },

  removeItem: (bookId) => {
    set((state) => ({
      // Filter out the item with the matching id
      items: state.items.filter((item) => item.id !== bookId),
    }));
  },

  updateQuantity: (bookId, quantity) => {
    const newQuantity = parseInt(quantity, 10); // Ensure quantity is a number

    if (newQuantity <= 0) {
      // If quantity is 0 or less, remove the item
      get().removeItem(bookId); // Call the removeItem action
    } else {
      // Otherwise, update the quantity of the matching item
      set((state) => ({
        items: state.items.map((item) =>
          item.id === bookId ? { ...item, quantity: newQuantity } : item
        ),
      }));
    }
  },

  
  clearCart: () => {
    set({ items: [] }); // Reset items array to empty
  },

  // Example of a computed value (selector-like, defined within the store creator)
  // Note: Often derived values are calculated directly in the component for simplicity,
  // unless the calculation is complex or reused across many components.
  // getTotalItems: () => {
  //   return get().items.reduce((total, item) => total + item.quantity, 0);
  // },
  // getTotalPrice: () => {
  //   return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  // }
}));

// Optional: Define selectors outside for reuse if preferred
export const selectCartItems = (state) => state.items;
export const selectTotalItems = (state) =>
  state.items.reduce((total, item) => total + item.quantity, 0);
export const selectTotalPrice = (state) =>
  state.items.reduce((total, item) => total + item.price * item.quantity, 0);

export const createCartItem = (image, title, author, originalPrice, salePrice, id, quantity, totalPrice) => ({
  image,
  title,
  author,
  originalPrice,
  salePrice,
  id,
  quantity,
  totalPrice
});