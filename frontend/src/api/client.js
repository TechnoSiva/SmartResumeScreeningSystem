const API_URL = '/api';

export async function fetchApi(endpoint) {
  const res = await fetch(`${API_URL}/${endpoint}`);
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function postApi(endpoint, data) {
  const res = await fetch(`${API_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function deleteApi(endpoint) {
  const res = await fetch(`${API_URL}/${endpoint}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function uploadFile(endpoint, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_URL}/${endpoint}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Upload Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
