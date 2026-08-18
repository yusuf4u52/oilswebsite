"use client";

import axios from "axios";

// Same-origin now that the API routes live in this app - no separate backend URL needed.
export const API = "/api";

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
