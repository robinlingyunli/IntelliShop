"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaMinus, FaPlus } from "react-icons/fa";

import { ApiError, apiFetch, getToken } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import { getEffectivePrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { items, refreshCart } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const cartItem = items.find((item) => item.product_id === product.id);

  const hasDiscount = product.discount_percentage !== null;
  const discountPercent = product.discount_percentage ?? 0;
  const effectivePrice = getEffectivePrice(product);

  const handleAddToCart = async () => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    setIsUpdating(true);
    setMessage(null);
    try {
      await apiFetch("/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      await refreshCart();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Failed to add to cart");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIncrease = async () => {
    if (!cartItem) return;
    setIsUpdating(true);
    setMessage(null);
    try {
      await apiFetch(`/cart/${cartItem.id}`, {
        method: "PUT",
        body: JSON.stringify({ quantity: cartItem.quantity + 1 }),
      });
      await refreshCart();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Failed to update quantity");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecrease = async () => {
    if (!cartItem) return;
    setIsUpdating(true);
    setMessage(null);
    try {
      if (cartItem.quantity <= 1) {
        await apiFetch(`/cart/${cartItem.id}`, { method: "DELETE" });
      } else {
        await apiFetch(`/cart/${cartItem.id}`, {
          method: "PUT",
          body: JSON.stringify({ quantity: cartItem.quantity - 1 }),
        });
      }
      await refreshCart();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Failed to update quantity");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="group relative flex h-56 items-center justify-center overflow-hidden bg-zinc-100 text-zinc-400 dark:bg-zinc-900">
        {hasDiscount && (
          <span className="absolute left-2 top-2 z-10 rounded bg-zinc-900 px-2 py-1 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
            -{discountPercent}%
          </span>
        )}
        {product.image_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_path}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="text-sm">No image</span>
        )}

        {/* Hover overlay — sits on top of the image and intercepts clicks, so only the
            Quick Look button (not the image itself) navigates to the product page */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Link
            href={`/product/${product.id}`}
            className="bg-white px-5 py-2 text-xs font-medium uppercase tracking-wide text-zinc-900 transition-colors hover:bg-zinc-100"
          >
            Quick Look
          </Link>
        </div>
      </div>

      <Link
        href={`/product/${product.id}`}
        className="flex flex-col items-center gap-1 p-3 pb-0 text-center"
      >
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{product.name}</h3>
        {hasDiscount ? (
          <p className="flex items-center gap-2">
            <span className="text-sm text-zinc-400 line-through">${product.price}</span>
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              ${effectivePrice.toFixed(2)}
            </span>
          </p>
        ) : (
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            ${product.price}
          </p>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3 pt-2">
        {cartItem ? (
          <div className="mt-auto flex items-center justify-center gap-3">
            <button
              onClick={handleDecrease}
              disabled={isUpdating}
              className="rounded-md border border-zinc-300 p-2 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
            >
              <FaMinus className="text-xs" />
            </button>
            <span className="w-6 text-center text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {cartItem.quantity}
            </span>
            <button
              onClick={handleIncrease}
              disabled={isUpdating}
              className="rounded-md border border-zinc-300 p-2 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
            >
              <FaPlus className="text-xs" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={isUpdating || product.stock === 0}
            className="mt-auto w-full border border-zinc-900 py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-900 transition-colors duration-200 hover:bg-zinc-900 hover:text-white disabled:opacity-50 dark:border-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-100 dark:hover:text-zinc-900"
          >
            {isUpdating ? "Adding..." : "Add to cart"}
          </button>
        )}
        {message && <p className="text-xs text-red-500">{message}</p>}
      </div>
    </div>
  );
}
