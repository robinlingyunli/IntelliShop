"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError, apiFetch, getToken } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "added" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleAddToCart = async () => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    setStatus("loading");
    setMessage(null);
    try {
      await apiFetch("/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      setStatus("added");
      setTimeout(() => setStatus("idle"), 1500);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof ApiError ? err.message : "Failed to add to cart");
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex aspect-square items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-zinc-900">
        {product.image_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_path}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm">No image</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-xs uppercase tracking-wide text-zinc-400">
          {product.category}
        </span>
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{product.name}</h3>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          ${product.price}
        </p>
        <p className="text-xs text-zinc-400">
          {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
        </p>

        <button
          onClick={handleAddToCart}
          disabled={status === "loading" || product.stock === 0}
          className="mt-auto rounded-full bg-zinc-900 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {status === "loading"
            ? "Adding..."
            : status === "added"
              ? "Added!"
              : "Add to cart"}
        </button>
        {message && <p className="text-xs text-red-500">{message}</p>}
      </div>
    </div>
  );
}
