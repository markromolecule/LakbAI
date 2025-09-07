const DEFAULT_BASE = `${window.location.protocol}//localhost/LakbAI/LakbAI-API`;
const API_BASE = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE;

export async function fetchCheckpoints() {
  const candidates = [
    `${API_BASE}/checkpoints`,
    `${window.location.origin}/LakbAI/LakbAI-API/checkpoints`,
    `${window.location.origin}/LakbAI/LakbAI-API/routes/api.php/checkpoints`,
  ];

  let lastError = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} @ ${url}`);
        continue;
      }
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data?.data;
      if (Array.isArray(arr) && arr.length) {
        return arr;
      }
      // If empty array is valid, still return it
      if (Array.isArray(arr)) return arr;
      lastError = new Error(`Invalid JSON shape @ ${url}`);
    } catch (e) {
      lastError = e;
      continue;
    }
  }
  console.error('fetchCheckpoints failed. Last error:', lastError);
  throw new Error('Failed to load checkpoints');
}


