import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const checkSchema = z.object({
  username: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username } = checkSchema.parse(body)

    // Use service role client so this check is not blocked by RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase URL or Service Role Key in check-username route')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Find commander by username
    const { data: commander, error: findError } = await supabase
      .from('commanders')
      .select('username')
      .eq('username', username)
      .eq('is_active', true)
      .maybeSingle()

    if (findError) {
      console.error('check-username findError:', findError)
    }

    if (!commander) {
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

