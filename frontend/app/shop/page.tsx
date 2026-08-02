"use client";

import { useEffect, useMemo, useState } from "react";

import ProductCard from "@/components/ProductCard";
import ShopFilters, { type ShopFilterState } from "@/components/ShopFilters";
import { apiFetch } from "@/lib/api";
import { getEffectivePrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ShopFilterState>({
    search: "",
    category: "",
    priceRange: "",
    discountOnly: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const discount = params.get("discount");
    if (category || discount) {
      setFilters((prev) => ({
        ...prev,
        category: category ?? prev.category,
        discountOnly: discount === "true" ? true : prev.discountOnly,
      }));
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await apiFetch<Product[]>("/products");
        setProducts(data);
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
    [products],
  );

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (filters.category) {
      result = result.filter((p) => p.category === filters.category);
    }

    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.description || "").toLowerCase().includes(term),
      );
    }

    if (filters.priceRange) {
      const [minStr, maxStr] = filters.priceRange.split("-");
      const min = parseFloat(minStr) || 0;
      const max = parseFloat(maxStr);
      const maxBound = Number.isFinite(max) ? max : Infinity;
      result = result.filter((p) => {
        const price = getEffectivePrice(p);
        return price >= min && price <= maxBound;
      });
    }

    if (filters.discountOnly) {
      result = result.filter((p) => p.discount_percentage != null);
    }

    return result;
  }, [products, filters]);

  const handleFilterChange = (changes: Partial<ShopFilterState>) => {
    setFilters((prev) => ({ ...prev, ...changes }));
  };

  const clearFilters = () => {
    setFilters({ search: "", category: "", priceRange: "", discountOnly: false });
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 lg:flex-row">
      <aside className="lg:w-1/4">
        <ShopFilters
          categories={categories}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
        />
      </aside>

      <div className="lg:w-3/4">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Shop</h1>

        {isLoading ? (
          <p className="text-zinc-500">Loading...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-zinc-500">No products match your filters.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
