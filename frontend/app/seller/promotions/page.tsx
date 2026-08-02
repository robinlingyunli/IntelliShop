"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FaBullhorn, FaPlus, FaTimes } from "react-icons/fa";
import { IoMdCloudUpload } from "react-icons/io";

import { ApiError, apiFetch, uploadProductImage } from "@/lib/api";
import type { Product, Promotion } from "@/lib/types";

function toDatetimeLocal(iso: string) {
  return iso.slice(0, 16);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function SellerPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deletingPromotion, setDeletingPromotion] = useState<Promotion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const previewSrc = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : imagePath),
    [imageFile, imagePath],
  );

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [promotionsData, productsData] = await Promise.all([
        apiFetch<Promotion[]>("/promotions"),
        apiFetch<Product[]>("/products/mine"),
      ]);
      setPromotions(promotionsData);
      setProducts(productsData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load promotions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableProducts = useMemo(() => {
    const editingProductIds = new Set(editingPromotion?.items.map((i) => i.product_id) ?? []);
    return products.filter(
      (p) => p.discount_percentage == null || editingProductIds.has(p.id),
    );
  }, [products, editingPromotion]);

  const openAddModal = () => {
    setEditingPromotion(null);
    setTitle("");
    setStartDate("");
    setEndDate("");
    setSelectedItems({});
    setImageFile(null);
    setImagePath(null);
    setShowModal(true);
  };

  const openEditModal = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setTitle(promotion.title);
    setStartDate(toDatetimeLocal(promotion.start_date));
    setEndDate(toDatetimeLocal(promotion.end_date));
    setSelectedItems(
      Object.fromEntries(promotion.items.map((i) => [i.product_id, i.discount_percentage])),
    );
    setImageFile(null);
    setImagePath(promotion.image_path);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPromotion(null);
    setImageFile(null);
    setImagePath(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePath(null);
  };

  const toggleProduct = (productId: number) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (productId in next) {
        delete next[productId];
      } else {
        next[productId] = 5;
      }
      return next;
    });
  };

  const setProductPercentage = (productId: number, value: number) => {
    setSelectedItems((prev) => ({ ...prev, [productId]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const items = Object.entries(selectedItems).map(([productId, discountPercentage]) => ({
      product_id: Number(productId),
      discount_percentage: discountPercentage,
    }));

    if (items.length === 0) {
      setError("Select at least one product");
      return;
    }

    setSubmitting(true);
    try {
      let finalImagePath = imagePath;
      if (imageFile) {
        const uploaded = await uploadProductImage(imageFile);
        finalImagePath = uploaded.image_path;
      }

      const payload = {
        title,
        image_path: finalImagePath,
        start_date: startDate,
        end_date: endDate,
        items,
      };

      if (editingPromotion) {
        await apiFetch(`/promotions/${editingPromotion.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/promotions", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      closeModal();
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save promotion");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPromotion) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/promotions/${deletingPromotion.id}`, { method: "DELETE" });
      setDeletingPromotion(null);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete promotion");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Promotions</h1>
          <p className="mt-1 text-sm text-zinc-500">Run discounts across your products</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          <FaPlus className="text-xs" />
          Add Promotion
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-zinc-500">Loading promotions...</p>
      ) : promotions.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 py-12 text-center dark:border-zinc-800">
          <FaBullhorn className="mx-auto mb-4 text-4xl text-zinc-300 dark:text-zinc-700" />
          <p className="text-zinc-500">No promotions yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {promotions.map((promotion) => (
            <div
              key={promotion.id}
              className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex h-56 items-center justify-center overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                {promotion.image_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={promotion.image_path}
                    alt={promotion.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FaBullhorn className="text-5xl text-zinc-300 dark:text-zinc-700" />
                )}
              </div>

              <div className="flex flex-1 flex-col items-center gap-2 p-6 text-center">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {promotion.title}
                </h3>
                <p className="text-sm text-zinc-500">
                  {formatDate(promotion.start_date)} &ndash; {formatDate(promotion.end_date)}
                </p>

                <div className="mt-auto flex w-full gap-2 pt-4">
                  <button
                    onClick={() => openEditModal(promotion)}
                    className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setDeletingPromotion(promotion)}
                    className="flex-1 rounded-lg bg-red-50 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-200 p-5 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {editingPromotion ? "Update Promotion" : "Add Promotion"}
              </h2>
              <button
                onClick={closeModal}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <input
                required
                placeholder="Promotion title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />

              <div>
                <label htmlFor="promotion-image" className="block cursor-pointer">
                  <div className="flex min-h-[140px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600">
                    {previewSrc ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewSrc}
                          alt="Preview"
                          className="mb-2 h-24 w-24 rounded-md object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            removeImage();
                          }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remove image
                        </button>
                      </>
                    ) : (
                      <>
                        <IoMdCloudUpload className="mb-2 text-3xl text-zinc-400" />
                        <span className="text-xs text-zinc-500">Click to upload a cover image</span>
                      </>
                    )}
                  </div>
                  <input
                    id="promotion-image"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Start date</label>
                  <input
                    required
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">End date</label>
                  <input
                    required
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs text-zinc-500">
                  Products (only products not already in another promotion are selectable)
                </label>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                  {availableProducts.length === 0 && (
                    <p className="text-xs text-zinc-400">No eligible products.</p>
                  )}
                  {availableProducts.map((product) => {
                    const isSelected = product.id in selectedItems;
                    return (
                      <div
                        key={product.id}
                        className="rounded-lg border border-zinc-100 p-2 dark:border-zinc-900"
                      >
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProduct(product.id)}
                            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-600"
                          />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {product.name}
                          </span>
                          <span className="ml-auto text-xs text-zinc-400">${product.price}</span>
                        </label>

                        {isSelected && (
                          <div className="mt-2 flex items-center gap-3 pl-6">
                            <input
                              type="range"
                              min={5}
                              max={95}
                              step={5}
                              value={selectedItems[product.id]}
                              onChange={(e) =>
                                setProductPercentage(product.id, Number(e.target.value))
                              }
                              className="flex-1"
                            />
                            <span className="w-10 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              {selectedItems[product.id]}%
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingPromotion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && setDeletingPromotion(null)}
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-5 dark:bg-zinc-950">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Delete promotion
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Are you sure you want to delete &ldquo;{deletingPromotion.title}&rdquo;? Affected
              products will return to their original price.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setDeletingPromotion(null)}
                className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
