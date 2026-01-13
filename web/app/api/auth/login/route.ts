import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = loginSchema.parse(body)

    const supabase = createClient()

    // Find commander by username
    const { data: commander, error: findError } = await supabase
      .from('commanders')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single()

    if (findError || !commander) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Use Supabase Auth for authentication
    // Email format: username@srtrack.local
    const email = `${commander.username}@srtrack.local`
    
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (sessionError) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Update last login time
    await supabase
      .from('commanders')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', commander.id)

    return NextResponse.json({ success: true })
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

