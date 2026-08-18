const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function getProducts(category) {
  const url = `${BACKEND_URL}/api/products${category && category !== "all" ? `?category=${category}` : ""}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products ?? [];
  } catch {
    return [];
  }
}

export async function getAllProductSlugs() {
  const products = await getProducts();
  return products.map((p) => p.slug);
}

export async function getProduct(slug) {
  const res = await fetch(`${BACKEND_URL}/api/products/${slug}`, { next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json();
}
