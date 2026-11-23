'use client'

// Hook مشترك لإرسال الـ token مع كل طلب API
// يستخدم localStorage بدلاً من cookies (يعمل في iframe)

export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('restaurant-session')
}

export function setSessionToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('restaurant-session', token)
}

export function clearSessionToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('restaurant-session')
}

// دالة fetch محسّنة ترسل الـ token تلقائياً
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getSessionToken()
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { 'x-session-token': token } : {}),
    },
  })
}
