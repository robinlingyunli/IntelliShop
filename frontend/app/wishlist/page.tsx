"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError, apiFetch, getToken } from "@/lib/api";
import { getEffectivePrice } from "@/lib/pricing";
import { useWishlist } from "@/lib/wishlist-context";
import type { WishlistItem } from "@/lib/types";

export default function WishlistPage() {
  const router = useRouter();
  const { refreshWishlist } = useWishlist();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    loadWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWishlist = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<WishlistItem[]>("/wishlist");
      setItems(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load wishlist");
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (productId: number) => {
    try {
      await apiFetch(`/wishlist/${productId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.product_id !== productId));
      await refreshWishlist();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove item");
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <p className="text-zinc-500">Loading wishlist...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Your Wishlist
      </h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center text-zinc-500">
          <p className="mb-4">Your wishlist is empty.</p>
          <Link href="/shop" className="font-medium text-zinc-900 underline dark:text-zinc-100">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const effectivePrice = getEffectivePrice(item.product);
            const hasDiscount = item.product.discount_percentage != null;

            return (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <Link
                  href={`/product/${item.product.id}`}
                  className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-900"
                >
                  {item.product.image_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.product.image_path}
                      alt={item.product.name}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    "No image"
                  )}
                </Link>

                <Link href={`/product/${item.product.id}`} className="flex-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {item.product.name}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {hasDiscount && (
                      <span className="mr-1 text-zinc-400 line-through">
                        ${item.product.price}
                      </span>
                    )}
                    ${effectivePrice.toFixed(2)}
                  </p>
                </Link>

                <button
                  onClick={() => removeItem(item.product_id)}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
