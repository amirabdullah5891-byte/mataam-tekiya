import { NextResponse } from 'next/server'
import { decode } from 'next-auth/jwt'
import { db } from '@/lib/db'

// قراءة قيمة cookie من headers
function getCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = cookieHeader.split(';')
  for (const c of cookies) {
    const [k, ...v] = c.trim().split('=')
    if (k === name) {
      return decodeURIComponent(v.join('='))
    }
  }
  return undefined
}

// GET /api/session - معلومات المستخدم الحالي من JWT cookie
export async function GET(request: Request) {
  try {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      return NextResponse.json({ user: null })
    }

    const sessionCookie =
      getCookie(request, 'next-auth.session-token') ||
      getCookie(request, '__Secure-next-auth.session-token')

    if (!sessionCookie) {
      return NextResponse.json({ user: null })
    }

    const token = await decode({
      token: sessionCookie,
      secret,
    })

    if (!token?.id) {
      return NextResponse.json({ user: null })
    }

    const user = await db.user.findUnique({
      where: { id: token.id as string },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user })
  } catch (e) {
    console.error('session error:', e)
    return NextResponse.json({ user: null })
  }
}
