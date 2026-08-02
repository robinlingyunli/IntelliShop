"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ProductCard from "@/components/ProductCard";
import { ApiError, apiFetch, getToken } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import { getEffectivePrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { refreshCart } = useCart();
  const id = params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");
  const [cartStatus, setCartStatus] = useState<"idle" | "loading" | "added" | "error">("idle");
  const [cartError, setCartError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setNotFound(false);
      try {
        const data = await apiFetch<Product>(`/products/${id}`);
        setProduct(data);

        const all = await apiFetch<Product[]>("/products");
        setRelatedProducts(
          all.filter((p) => p.category === data.category && p.id !== data.id).slice(0, 4),
        );
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleAddToCart = async () => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    if (!product) return;

    setCartStatus("loading");
    setCartError(null);
    try {
      await apiFetch("/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: product.id, quantity }),
      });
      await refreshCart();
      setCartStatus("added");
      setTimeout(() => setCartStatus("idle"), 1500);
    } catch (err) {
      setCartStatus("error");
      setCartError(err instanceof ApiError ? err.message : "Failed to add to cart");
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <p className="text-zinc-500">Loading...</p>
      </main>
    );
  }

  if (notFound || !product) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <p className="text-zinc-500">Product not found.</p>
      </main>
    );
  }

  const hasDiscount = product.discount_percentage !== null;
  const displayPrice = getEffectivePrice(product).toFixed(2);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      {/* Breadcrumbs */}
      <div className="mb-8 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/shop" className="hover:text-zinc-900 dark:hover:text-zinc-100">
          Shop
        </Link>
        <span>/</span>
        <span className="capitalize">{product.category}</span>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-100">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
          {product.image_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_path}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400">
              No image
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            {product.name}
          </h1>

          <div className="flex items-center gap-3">
            {hasDiscount && (
              <span className="text-xl text-zinc-400 line-through">${product.price}</span>
            )}
            <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              ${displayPrice}
            </span>
            {hasDiscount && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-400">
                Sale
              </span>
            )}
          </div>

          <p className="text-zinc-600 dark:text-zinc-400">
            {product.description || "No description available."}
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Quantity:
              </span>
              <div className="flex items-center rounded-md border border-zinc-300 dark:border-zinc-700">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="px-3 py-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  &minus;
                </button>
                <span className="min-w-[48px] border-x border-zinc-300 px-4 py-2 text-center dark:border-zinc-700">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="px-3 py-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={cartStatus === "loading" || product.stock === 0}
              className="w-full rounded-full bg-zinc-900 py-3 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {cartStatus === "loading"
                ? "Adding..."
                : cartStatus === "added"
                  ? "Added!"
                  : "Add to Cart"}
            </button>
            {cartError && <p className="text-sm text-red-500">{cartError}</p>}
          </div>

          <div className="space-y-1 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
            <p>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Category:</span>{" "}
              <span className="capitalize text-zinc-600 dark:text-zinc-400">
                {product.category}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs: Description / Reviews */}
      <div className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800">
        <div className="mb-6 flex gap-8 border-b border-zinc-200 dark:border-zinc-800">
          {(["description", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {tab === "reviews" ? "Reviews (0)" : "Description"}
            </button>
          ))}
        </div>

        {activeTab === "description" ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            {product.description || "No description available."}
          </p>
        ) : (
          <p className="text-zinc-500">No reviews yet. Be the first to leave a review!</p>
        )}
      </div>

      {/* Related Products */}
      <div className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800">
        <h2 className="mb-8 text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Related Products
        </h2>
        {relatedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-center text-zinc-500">No related products found.</p>
        )}
      </div>
    </main>
  );
}
