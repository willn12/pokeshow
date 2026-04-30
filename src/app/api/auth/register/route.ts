import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password, name, businessName, bio } = await req.json()

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  const hashed = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email, password: hashed, name, businessName, bio },
  })

  const token = signToken({ userId: user.id, email: user.email })

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, businessName: user.businessName },
  })
  res.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
