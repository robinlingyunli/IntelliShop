"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError, apiFetch, getToken } from "@/lib/api";
import type { CartItem } from "@/lib/types";

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCart = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<CartItem[]>("/cart");
      setItems(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load cart");
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    try {
      await apiFetch(`/cart/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      });
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update quantity");
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await apiFetch(`/cart/${itemId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove item");
    }
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setError(null);
    try {
      await apiFetch("/orders", { method: "POST" });
      router.push("/orders");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Checkout failed");
      setIsCheckingOut(false);
    }
  };

  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <p className="text-zinc-500">Loading cart...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Your Cart
      </h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center text-zinc-500">
          <p className="mb-4">Your cart is empty.</p>
          <Link href="/" className="font-medium text-zinc-900 underline dark:text-zinc-100">
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-900">
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
                </div>

                <div className="flex-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {item.product.name}
                  </p>
                  <p className="text-sm text-zinc-500">${item.product.price} each</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="h-7 w-7 rounded-full border border-zinc-300 text-sm dark:border-zinc-700"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="h-7 w-7 rounded-full border border-zinc-300 text-sm dark:border-zinc-700"
                  >
                    +
                  </button>
                </div>

                <p className="w-16 text-right text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  ${(Number(item.product.price) * item.quantity).toFixed(2)}
                </p>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Total: ${total.toFixed(2)}
            </span>
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {isCheckingOut ? "Placing order..." : "Checkout"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
