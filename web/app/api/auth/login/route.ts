// This route is deprecated - login is now handled client-side
// Keeping for backwards compatibility but it's not used
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Please use client-side authentication.' },
    { status: 410 }
  )
}

