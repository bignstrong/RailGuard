import React, { createContext, useCallback, useContext, useState } from 'react';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  quantity: number;
  image: string;
}

export interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  totalItems: number;
  totalPrice: number;
  totalOldPrice?: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  addToCart: (id: string) => void;
}

export const CartContext = createContext<CartContextType>({
  items: [],
  isCartOpen: false,
  totalItems: 0,
  totalPrice: 0,
  totalOldPrice: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  toggleCart: () => {},
  addToCart: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalOldPrice = items.reduce((sum, item) => sum + (item.oldPrice || item.price) * item.quantity, 0);

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === newItem.id);

      if (existingItem) {
        return currentItems.map((item) => (item.id === newItem.id ? { ...newItem, quantity: item.quantity + 1 } : item));
      }

      return [...currentItems, { ...newItem, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;

    setItems((currentItems) => currentItems.map((item) => (item.id === id ? { ...item, quantity } : item)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const toggleCart = useCallback(() => {
    setIsCartOpen((prev) => !prev);
  }, []);

  const addToCart = useCallback(
    (id: string) => {
      const productData = {
        id,
        title: id, // This should be replaced with actual product data lookup
        price: 8500, // This should be replaced with actual product data lookup
        image: '/Filter.png', // This should be replaced with actual product data lookup
      };
      addItem(productData);
      toggleCart();
    },
    [addItem, toggleCart],
  );

  const value = {
    items,
    isCartOpen,
    totalItems,
    totalPrice,
    totalOldPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    addToCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
