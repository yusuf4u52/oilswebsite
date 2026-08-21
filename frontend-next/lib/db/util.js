export function nowIso() {
  return new Date().toISOString();
}

// Mongo docs carry an internal _id alongside our own `id` field; API responses
// should never leak it.
export function stripId({ _id, ...rest }) {
  return rest;
}
