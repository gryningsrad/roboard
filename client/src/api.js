export async function apiGet(path) {
  const res = await fetch(path);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `GET ${path} failed (${res.status})`);
  }
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `POST ${path} failed (${res.status})`);
  }
  return res.json();
}
