"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FaArrowRight, FaBoxOpen, FaChevronLeft, FaChevronRight } from "react-icons/fa";

import ProductCard from "@/components/ProductCard";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/lib/types";

interface Highlight {
  title: string;
  description: string;
  href: string;
  image?: string; // hardcoded static image — takes priority over `match`
  match?: (p: Product) => boolean; // otherwise, use the first matching product's image
}

// Hand-picked homepage highlights. Update this list as the catalog's categories grow.
const HIGHLIGHTS: Highlight[] = [
  {
    title: "Big Savings",
    description: "Don't miss out — shop our best discounts on Electronics.",
    href: `/shop?category=${encodeURIComponent("Electronics")}&discount=true`,
    image: "/homepage/deal.jpg",
  },
  {
    title: "Toys for Little Ones",
    description:
      "Fun and playful picks for kids of all ages. From building blocks to board games, there's something here to spark every imagination.",
    href: `/shop?category=${encodeURIComponent("Toys & Games")}`,
    image: "/homepage/deal2.jpg",
  },
  {
    title: "Office Supplies",
    description: "Everything you need to stock your home office.",
    href: `/shop?category=${encodeURIComponent("Office Supplies")}`,
    image: "/homepage/deal3.jpg",
  },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    apiFetch<Product[]>("/products")
      .then(setProducts)
      .catch(() => setProducts([]));
    apiFetch<Product[]>("/products/bestsellers")
      .then(setBestsellers)
      .catch(() => setBestsellers([]));
  }, []);

  const newArrivals = useMemo(
    () =>
      [...products]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3),
    [products],
  );

  const slides = useMemo(
    () =>
      HIGHLIGHTS.map((highlight) => ({
        ...highlight,
        image: highlight.image ?? products.find(highlight.match ?? (() => false))?.image_path ?? null,
      })),
    [products],
  );

  const current = slides[index] ?? slides[0];

  const goPrev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const goNext = () => setIndex((i) => (i + 1) % slides.length);

  if (!current) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-8">
        <p className="text-zinc-400">Home page coming soon.</p>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="relative min-h-[500px] w-full overflow-hidden bg-gradient-to-br from-zinc-100 via-zinc-50 to-white dark:from-zinc-900 dark:via-zinc-950 dark:to-black">
        {slides.map((slide, i) => (
          <div
            key={slide.title}
            className={`absolute inset-0 flex items-center transition-opacity duration-700 ease-linear ${
              i === index ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
            }`}
          >
            <div className="mx-auto flex w-full max-w-7xl items-center gap-10 px-6 py-16 sm:px-10 md:py-24">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-zinc-900 sm:text-5xl dark:text-zinc-50">
                  {slide.title}
                </h1>
                <p className="mt-5 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
                  {slide.description}
                </p>
                <Link
                  href={slide.href}
                  className="mt-8 inline-block rounded-full bg-zinc-900 px-8 py-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  Shop now
                </Link>
              </div>

              <div className="hidden flex-1 items-center justify-center md:flex">
                <div className="flex aspect-square w-full max-w-md items-center justify-center overflow-hidden rounded-3xl bg-white/70 shadow-inner dark:bg-zinc-800/50">
                  {slide.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FaBoxOpen className="text-6xl text-zinc-300 dark:text-zinc-700" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={goPrev}
          aria-label="Previous"
          className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-zinc-700 shadow transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <FaChevronLeft />
        </button>
        <button
          onClick={goNext}
          aria-label="Next"
          className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-zinc-700 shadow transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <FaChevronRight />
        </button>
      </section>

      <div className="flex justify-center py-16">
        <Link
          href="/shop"
          className="group flex items-center gap-2 text-2xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Shop All Products
          <FaArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>

      {newArrivals.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-12">
          <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            New Arrivals
          </h2>
          <div className="grid grid-cols-2 gap-16 sm:grid-cols-3">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {bestsellers.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-12">
          <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Our Bestsellers
          </h2>
          <div className="grid grid-cols-2 gap-16 sm:grid-cols-3">
            {bestsellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
