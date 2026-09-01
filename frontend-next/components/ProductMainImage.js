"use client";

import Image from "next/image";
import { useProductVariant } from "@/context/ProductVariantContext";

// Falls back to the product's own image when the selected variant has none.
export default function ProductMainImage({ product }) {
  const { variant } = useProductVariant();
  const src = variant?.image_url || product.image_url;
  if (!src) return null;
  return (
    <Image
      data-testid="pd-main-image"
      src={src}
      alt={product.name}
      fill
      priority
      className="object-cover"
      sizes="(min-width: 768px) 50vw, 100vw"
    />
  );
}
