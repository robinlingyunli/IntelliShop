"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { apiFetch, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { CartItem } from "@/lib/types";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  const refreshCart = async () => {
    if (!getToken()) {
      setItems([]);
      return;
    }
    try {
      const data = await apiFetch<CartItem[]>("/cart");
      setItems(data);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    refreshCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  return (
    <CartContext.Provider value={{ items, itemCount: items.length, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
