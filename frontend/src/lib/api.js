import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// image_url may be a same-origin-relative path (new backend) or an already
// absolute URL (legacy data, or a future move back to a CDN) — this app has
// no backend of its own to be relative against, so relative paths resolve
// against the API host instead of the page's own origin.
export const resolveImageUrl = (url) => (url && !/^https?:\/\//i.test(url) ? `${BACKEND_URL}${url}` : url);

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export const inr = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
