"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError, apiFetch, getToken } from "@/lib/api";
import type { Order } from "@/lib/types";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    const loadOrders = async () => {
      try {
        const data = await apiFetch<Order[]>("/orders");
        setOrders(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [router]);

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <p className="text-zinc-500">Loading orders...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Your Orders
      </h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center text-zinc-500">
          <p className="mb-4">You haven&apos;t placed any orders yet.</p>
          <Link href="/" className="font-medium text-zinc-900 underline dark:text-zinc-100">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    Order #{order.id}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium capitalize text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {order.status}
                  </span>
                  <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">
                    ${order.total_amount}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-zinc-100 border-t border-zinc-100 pt-2 dark:divide-zinc-900 dark:border-zinc-900">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="text-zinc-500">
                      ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
