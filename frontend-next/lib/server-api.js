import { listProducts, getProductBySlug } from "@/lib/services/products";

// Server Components call the same service functions the API routes use directly -
// no HTTP self-fetch, since this now runs in the same process as the DB layer.
export async function getProducts(category) {
  return listProducts(category);
}

export async function getAllProductSlugs() {
  const products = await listProducts();
  return products.map((p) => p.slug);
}

export async function getProduct(slug) {
  const product = await getProductBySlug(slug);
  return product ?? null;
}
