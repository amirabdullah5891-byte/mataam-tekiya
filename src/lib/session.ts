// مساعد للتحقق من الجلسة في API routes باستخدام JWT token
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { db } from './db'

export type SessionUser = {
  id: string
  username: string
  name: string
  role: string
}

export async function getSessionUser(request: NextRequest | Request): Promise<SessionUser | null> {
  try {
    const token = await getToken({
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET,
    })
    if (!token?.id) return null

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

    if (!user || !user.isActive) return null

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    }
  } catch {
    return null
  }
}

export function unauthorizedResponse() {
  return Response.json({ error: 'غير مصرح' }, { status: 401 })
}

export function forbiddenResponse(message = 'هذه الميزة للمدير فقط') {
  return Response.json({ error: message }, { status: 403 })
}
