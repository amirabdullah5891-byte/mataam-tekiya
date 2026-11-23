import { NextRequest } from 'next/server'
import { deleteSession, clearSessionResponse, getRequestToken } from '@/lib/session'

// POST /api/auth/logout - تسجيل الخروج وحذف الجلسة
export async function POST(request: NextRequest) {
  try {
    const token = getRequestToken(request)
    if (token) {
      await deleteSession(token)
    }
    return clearSessionResponse({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return clearSessionResponse({ success: true })
  }
}
