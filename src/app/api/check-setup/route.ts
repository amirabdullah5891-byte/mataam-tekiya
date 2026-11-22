import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/check-setup - فحص إذا كان النظام يحتاج لإعداد أولي
export async function GET() {
  try {
    const userCount = await db.user.count()
    return NextResponse.json({ needsSetup: userCount === 0, userCount })
  } catch {
    return NextResponse.json({ needsSetup: false, userCount: -1 })
  }
}
