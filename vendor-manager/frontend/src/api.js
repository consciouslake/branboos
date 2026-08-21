export async function getVendors() {
  const res = await fetch('/vendors');
  if (!res.ok) return [];
  const data = await res.json();
  return data.vendors ?? [];
}

export async function getRecommendation(requirement) {
  const res = await fetch('/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requirement),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Recommend request failed: ${res.status}`);
  }
  return data;
}
