import type { Product } from "@/lib/types";

export function getEffectivePrice(product: Product): number {
  const price = Number(product.price);
  if (product.discount_percentage == null) return price;
  return price * (1 - product.discount_percentage / 100);
}
