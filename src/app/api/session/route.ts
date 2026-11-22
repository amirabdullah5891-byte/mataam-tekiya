import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

// GET /api/session - معلومات المستخدم الحالي من JWT
export async function GET(request: Request) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
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
    return NextResponse.json({ user: null })
  }
}
