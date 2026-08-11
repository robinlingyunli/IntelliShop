"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { apiFetch, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { WishlistItem } from "@/lib/types";

interface WishlistContextValue {
  items: WishlistItem[];
  itemCount: number;
  isWishlisted: (productId: number) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);

  const refreshWishlist = async () => {
    if (!getToken()) {
      setItems([]);
      return;
    }
    try {
      const data = await apiFetch<WishlistItem[]>("/wishlist");
      setItems(data);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    refreshWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const isWishlisted = (productId: number) => items.some((item) => item.product_id === productId);

  return (
    <WishlistContext.Provider
      value={{ items, itemCount: items.length, isWishlisted, refreshWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return ctx;
}
