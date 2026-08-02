"use client";

import { useState } from "react";
import { FaStar } from "react-icons/fa";

export interface ShopFilterState {
  search: string;
  category: string;
  priceRange: string;
  discountOnly: boolean;
}

interface ShopFiltersProps {
  categories: string[];
  filters: ShopFilterState;
  onFilterChange: (changes: Partial<ShopFilterState>) => void;
  onClearFilters: () => void;
}

const pricePresets = [
  { label: "Under $50", min: 0, max: 50 },
  { label: "$50-$100", min: 50, max: 100 },
  { label: "$100-$200", min: 100, max: 200 },
  { label: "Over $200", min: 200, max: 1000000 },
];

export default function ShopFilters({
  categories,
  filters,
  onFilterChange,
  onClearFilters,
}: ShopFiltersProps) {
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const applyPriceFilter = () => {
    onFilterChange({ priceRange: `${priceMin}-${priceMax}` });
  };

  const applyPreset = (min: number, max: number) => {
    setPriceMin(String(min));
    setPriceMax(String(max));
    onFilterChange({ priceRange: `${min}-${max}` });
  };

  return (
    <div className="w-full space-y-6">
      {/* Search */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Search Products
        </h3>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          placeholder="Search products..."
          className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
        />
      </div>

      {/* Categories */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Categories
        </h3>
        <div className="space-y-3">
          {categories.length === 0 && (
            <p className="text-sm text-zinc-400">No categories yet.</p>
          )}
          {categories.map((category) => (
            <label key={category} className="group flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={filters.category === category}
                onChange={() =>
                  onFilterChange({
                    category: filters.category === category ? "" : category,
                  })
                }
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-600"
              />
              <span className="ml-3 capitalize text-zinc-700 transition-colors group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100">
                {category}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Price Range
        </h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-zinc-500">Min Price</label>
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="0"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm text-zinc-500">Max Price</label>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="1000"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
          <button
            onClick={applyPriceFilter}
            className="w-full rounded-md bg-zinc-900 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Apply Price Filter
          </button>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Quick Filters:
            </h4>
            <div className="flex flex-wrap gap-2">
              {pricePresets.map((range) => (
                <button
                  key={range.label}
                  onClick={() => applyPreset(range.min, range.max)}
                  className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Discount */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <label className="flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={filters.discountOnly}
            onChange={(e) => onFilterChange({ discountOnly: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-600"
          />
          <span className="ml-3 text-zinc-700 dark:text-zinc-300">Deals & Discounts</span>
        </label>
      </div>

      {/* Customer Rating — UI only for now, no backing rating data yet */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Customer Rating
        </h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => (
            <label key={rating} className="group flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-600"
              />
              <div className="ml-3 flex items-center">
                <div className="flex text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FaStar
                      key={i}
                      className={i < rating ? "text-yellow-400" : "text-zinc-300 dark:text-zinc-700"}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-zinc-500">&amp; up</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <button
          onClick={onClearFilters}
          className="w-full rounded-lg bg-zinc-100 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}
