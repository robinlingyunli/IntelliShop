"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CiSearch } from "react-icons/ci";
import { IoCloseOutline } from "react-icons/io5";

import { apiFetch } from "@/lib/api";
import { getEffectivePrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";

export default function SearchBox() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await apiFetch<Product[]>(
          `/products?q=${encodeURIComponent(search)}`,
        );
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (product: Product) => {
    setSearch("");
    setIsFocused(false);
    router.push(`/product/${product.id}`);
  };

  return (
    <div ref={containerRef} className="relative min-w-0 max-w-xl flex-1">
      <div className="relative">
        <CiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search products..."
          className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-9 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <IoCloseOutline className="text-lg" />
          </button>
        )}
      </div>

      {isFocused && search && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-zinc-100 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-zinc-500">Searching...</div>
          ) : results.length > 0 ? (
            <>
              <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-500 dark:border-zinc-900 dark:bg-zinc-900">
                {results.length} product{results.length !== 1 ? "s" : ""} found
              </div>
              {results.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="flex w-full items-center gap-3 border-b border-zinc-50 px-4 py-3 text-left last:border-b-0 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900"
                >
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {product.image_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_path}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <CiSearch className="text-zinc-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {product.name}
                    </p>
                    <p className="text-sm text-zinc-500">
                      ${getEffectivePrice(product).toFixed(2)}
                    </p>
                  </div>
                  <CiSearch className="flex-shrink-0 text-zinc-400" />
                </button>
              ))}
            </>
          ) : (
            <div className="p-6 text-center text-sm text-zinc-500">
              No products match &ldquo;{search}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
