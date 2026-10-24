// Client-side helper for calling the /api route handlers.
// Throws if the response is not JSON (e.g. a static page served instead of the API),
// so a misconfigured deployment shows up as an error instead of a silent no-op.
export async function callApi<T>(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown; idToken?: string } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.idToken) headers.Authorization = `Bearer ${options.idToken}`;

  const res = await fetch(path, {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (!res.headers.get("content-type")?.includes("application/json")) {
    throw new Error(`Unexpected response from ${path} (${res.status})`);
  }
  return (await res.json()) as T;
}
