const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Node's fetch has no default timeout, so an unreachable/slow backend during
// build (misconfigured NEXT_PUBLIC_BACKEND_URL, backend not up yet, etc.)
// can hang a route's static generation until Next's own watchdog kills it,
// or throw uncaught (ECONNREFUSED) and crash the whole build. Bound and
// catch every request so a dead backend degrades gracefully instead.
const FETCH_TIMEOUT_MS = 8000;

export async function getProducts(category) {
  const url = `${BACKEND_URL}/api/products${category && category !== "all" ? `?category=${category}` : ""}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
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
  try {
    const res = await fetch(`${BACKEND_URL}/api/products/${slug}`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch product");
    return res.json();
  } catch {
    return null;
  }
}
