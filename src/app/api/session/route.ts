import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/session'

// GET /api/session - معلومات المستخدم الحالي
export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ user: null })
    }
    return NextResponse.json({ user })
  } catch (e) {
    console.error('session error:', e)
    return NextResponse.json({ user: null })
  }
}
