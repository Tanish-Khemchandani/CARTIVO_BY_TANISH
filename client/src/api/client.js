// single place that knows the API base URL, so no component hardcodes it
const defaultHost = typeof window === "undefined" ? "localhost" : window.location.hostname;
const BASE_URL = (import.meta.env.VITE_API_URL || `http://${defaultHost}:5000/api`).replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 20000;
const UPLOAD_TIMEOUT_MS = 60000;

function timedFetch(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  const callerSignal = options.signal;
  const abortFromCaller = () => controller.abort(callerSignal?.reason);
  if (callerSignal?.aborted) abortFromCaller();
  else callerSignal?.addEventListener("abort", abortFromCaller, { once: true });

  return fetch(url, { ...options, signal: controller.signal })
    .catch((error) => {
      if (controller.signal.aborted && !callerSignal?.aborted) {
        const timeoutError = new Error("The server is taking too long to respond. Please try again.");
        timeoutError.name = "TimeoutError";
        throw timeoutError;
      }
      throw error;
    })
    .finally(() => {
      window.clearTimeout(timeoutId);
      callerSignal?.removeEventListener("abort", abortFromCaller);
    });
}

export function apiAssetUrl(path) {
  if (!path || /^https?:\/\//i.test(path)) return path;
  const origin = BASE_URL.replace(/\/api$/i, "");
  if (path.startsWith("/api/")) return `${origin}${path}`;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

async function request(path, options = {}) {
  const res = await timedFetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.success) {
    const error = new Error(body?.message || `Request failed: ${res.status}`);
    error.status = res.status;
    throw error;
  }

  return body;
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: "POST", body: JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: "DELETE" }),
};

// Multipart upload (files + optional fields). Do NOT set Content-Type:
// the browser must generate the multipart boundary itself.
export async function apiUpload(path, formData) {
  const res = await timedFetch(`${BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  }, UPLOAD_TIMEOUT_MS);
  const body = await res.json().catch(() => null);
  if (!res.ok || !body) {
    const error = new Error(body?.message || `Upload failed: ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return body;
}

// CSV (and future binary) downloads share the API base + signed-in cookie.
// Kept separate from request() because the response is a file, not JSON.
export async function downloadCsv(path, filename) {
  const res = await timedFetch(`${BASE_URL}${path}`, { credentials: "include" }, UPLOAD_TIMEOUT_MS);
  if (!res.ok) {
    let message = `Export failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // response was not JSON; keep the status message
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
