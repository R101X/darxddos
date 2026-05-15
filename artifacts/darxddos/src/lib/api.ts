export async function apiFetch<T>(
  path: string,
  opts?: RequestInit,
): Promise<T> {
  const r = await fetch(`/api${path}`, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(opts?.headers ?? {}),
    },
  });
  const data = (await r.json()) as T & { error?: string };
  if (!r.ok)
    throw new Error((data as { error?: string }).error ?? "Request failed");
  return data;
}
