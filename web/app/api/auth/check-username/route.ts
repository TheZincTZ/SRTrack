import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const checkSchema = z.object({
  username: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username } = checkSchema.parse(body)

    const supabase = createClient()

    // Find commander by username
    const { data: commander, error: findError } = await supabase
      .from('commanders')
      .select('username')
      .eq('username', username)
      .eq('is_active', true)
      .single()

    if (findError || !commander) {
      return NextResponse.json(
        { error: 'Invalid username' },
        { status: 401 }
      )
    }

    // Return email format for client-side auth
    const email = `${commander.username}@srtrack.local`
    return NextResponse.json({ email })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

