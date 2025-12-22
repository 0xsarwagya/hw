// This file is kept for backward compatibility
// All API calls should use lib/api/client.ts directly
// Re-export the real API client
import {
  apiClient,
  del,
  endpoints,
  get,
  patch,
  post,
  put,
} from "../lib/api/client";
export { apiClient, endpoints, get, post, put, patch, del };
