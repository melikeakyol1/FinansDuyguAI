const BASE_URL = "https://localhost:7181";
 
export async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem("token");
 
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
 
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
 
  // Token süresi dolmuşsa login'e yönlendir
  if (res.status === 401) {
    sessionStorage.clear();
    window.location.href = "/";
    throw new Error("Oturum süresi doldu. Lütfen tekrar giriş yapın.");
  }
 
  return res;
}
 
// FormData gönderimler için ayrı fonksiyon (Content-Type header'ı atla)
export async function apiFetchForm(path, formData) {
  const token = sessionStorage.getItem("token");
 
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
 
  if (res.status === 401) {
    sessionStorage.clear();
    window.location.href = "/";
    throw new Error("Oturum süresi doldu.");
  }
 
  return res;
}