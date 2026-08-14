"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function Footer() {
  const [products, setProducts] = useState<Product[]>([]);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    apiFetch<Product[]>("/products")
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  const categories = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [products],
  );

  const isValidEmail = (value: string) =>
    /^\w+([-]?\w+)*@\w+([-]?\w+)*(\.\w{2,3})+$/.test(value);

  const handleSubscribe = () => {
    if (email === "") {
      setErrMsg("Please provide an email!");
    } else if (!isValidEmail(email)) {
      setErrMsg("Please give a valid email!");
    } else {
      setSubscribed(true);
      setErrMsg("");
      setEmail("");
    }
  };

  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-4 py-16 md:grid-cols-3">
        {/* Brand */}
        <div>
          <h3 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            IntelliShop
          </h3>
          <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
            Shop smarter with an AI assistant that finds the right products, tracks deals, and
            manages your cart for you — all in one place.
          </p>
        </div>

        {/* Categories */}
        <div>
          <h4 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Categories
          </h4>
          <ul className="space-y-3">
            {categories.map((category) => (
              <li key={category}>
                <Link
                  href={`/shop?category=${encodeURIComponent(category)}`}
                  className="text-sm text-zinc-600 transition-colors duration-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Stay Updated
          </h4>
          <p className="mb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Subscribe to get updates on new products and exclusive offers.
          </p>

          {subscribed ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                ✓ Successfully subscribed!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none transition-all focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
                />
                {errMsg && <p className="mt-2 text-xs text-red-500">{errMsg}</p>}
              </div>
              <button
                onClick={handleSubscribe}
                className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Subscribe
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
