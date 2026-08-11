"use client";

import { useEffect, useMemo, useState } from "react";

import ProductCard from "@/components/ProductCard";
import ShopFilters, { type ShopFilterState } from "@/components/ShopFilters";
import { apiFetch } from "@/lib/api";
import { getEffectivePrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";

type SortOption = "newest" | "price-low" | "price-high" | "name";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ShopFilterState>({
    search: "",
    category: "",
    priceRange: "",
    discountOnly: false,
  });
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);

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
    () =>
      Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [products],
  );

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (filters.category) {
      result = result.filter((p) => p.category === filters.category);
    }

    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(term));
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

  const sortedProducts = useMemo(() => {
    const result = [...filteredProducts];
    switch (sortBy) {
      case "price-low":
        return result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
      case "price-high":
        return result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
      case "name":
        return result.sort((a, b) => a.name.localeCompare(b.name));
      case "newest":
      default:
        return result.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    }
  }, [filteredProducts, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / itemsPerPage));
  const startItem = sortedProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, sortedProducts.length);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleFilterChange = (changes: Partial<ShopFilterState>) => {
    setFilters((prev) => ({ ...prev, ...changes }));
  };

  const clearFilters = () => {
    setFilters({ search: "", category: "", priceRange: "", discountOnly: false });
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 lg:flex-row">
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

        <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-sm text-zinc-500">
            Showing {startItem}-{endItem} of {sortedProducts.length} results
          </span>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="perPage" className="text-sm text-zinc-500">
                Show:
              </label>
              <select
                id="perPage"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={36}>36</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sortBy" className="text-sm text-zinc-500">
                Sort by:
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <p className="text-zinc-500">Loading...</p>
        ) : sortedProducts.length === 0 ? (
          <p className="text-zinc-500">No products match your filters.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Previous
                </button>
                <span className="text-sm text-zinc-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
