type SafeFetchOptions = RequestInit & {
  fallbackError?: string;
};

export async function safeFetchJSON<T = unknown>(url: string, options: SafeFetchOptions = {}) {
  const { fallbackError, ...fetchOptions } = options;
  const res = await fetch(url, fetchOptions);
  const text = await res.text();

  let data: T | null = null;

  try {
    data = text ? (JSON.parse(text) as T) : null;
  } catch {
    throw new Error(`Respuesta no valida en ${url}: ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : fallbackError || `Error ${res.status} en ${url}`;
    throw new Error(message);
  }

  return data;
}
