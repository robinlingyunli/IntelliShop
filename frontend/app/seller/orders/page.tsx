"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaBox,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaSearch,
  FaShoppingBag,
  FaTimes,
  FaTruck,
} from "react-icons/fa";

import { ApiError, apiFetch } from "@/lib/api";
import type { SellerOrderItem } from "@/lib/types";

const statusOptions = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900",
  paid: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
  shipped: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900",
  cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <FaClock className="text-xs" />,
  paid: <FaCheckCircle className="text-xs" />,
  shipped: <FaTruck className="text-xs" />,
  delivered: <FaBox className="text-xs" />,
  cancelled: <FaTimes className="text-xs" />,
};

export default function SellerOrdersPage() {
  const [orderItems, setOrderItems] = useState<SellerOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editingItem, setEditingItem] = useState<SellerOrderItem | null>(null);
  const [newStatus, setNewStatus] = useState<string>("pending");
  const [isSaving, setIsSaving] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<SellerOrderItem[]>("/orders/seller");
      setOrderItems(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return orderItems.filter((item) => {
      const matchesSearch =
        item.product.name.toLowerCase().includes(term) ||
        item.buyer_username.toLowerCase().includes(term) ||
        String(item.order_id).includes(term);
      const matchesStatus = statusFilter === "all" || item.order_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orderItems, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const pending = orderItems.filter((i) => i.order_status === "pending").length;
    const delivered = orderItems.filter((i) => i.order_status === "delivered").length;
    const revenue = orderItems.reduce(
      (sum, i) => sum + Number(i.unit_price) * i.quantity,
      0,
    );
    return { total: orderItems.length, pending, delivered, revenue };
  }, [orderItems]);

  const openEditModal = (item: SellerOrderItem) => {
    setEditingItem(item);
    setNewStatus(item.order_status);
  };

  const closeEditModal = () => {
    setEditingItem(null);
  };

  const handleSaveStatus = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    setError(null);
    try {
      await apiFetch(`/orders/seller/${editingItem.order_id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      await loadOrders();
      closeEditModal();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update order status");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Orders</h1>
        <p className="mt-1 text-sm text-zinc-500">Orders containing your products</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500">Total Items</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500">Delivered</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.delivered}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500">Revenue</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            ${stats.revenue.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by order #, product, or buyer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="all">All Status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-zinc-500">Loading orders...</p>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 py-12 text-center dark:border-zinc-800">
          <FaShoppingBag className="mx-auto mb-4 text-4xl text-zinc-300 dark:text-zinc-700" />
          <p className="text-zinc-500">
            {orderItems.length === 0
              ? "No orders for your products yet."
              : "No orders match your filters."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Buyer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    #{item.order_id}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {item.product.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {item.buyer_username}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(item.order_created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{item.quantity}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${statusStyles[item.order_status] ?? ""}`}
                    >
                      {statusIcons[item.order_status]}
                      {item.order_status.charAt(0).toUpperCase() + item.order_status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEditModal(item)}
                      className="flex items-center gap-1 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <FaEdit /> Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeEditModal()}
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-5 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Order #{editingItem.order_id}
              </h3>
              <button
                onClick={closeEditModal}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Order Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="mb-5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={closeEditModal}
                className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStatus}
                disabled={isSaving}
                className="flex-1 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
