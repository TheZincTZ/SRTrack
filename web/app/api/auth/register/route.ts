import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  rank: z.string().min(1, 'Rank is required'),
  full_name: z.string().min(1, 'Full name is required'),
  company: z.enum(['A', 'B', 'C', 'Support', 'MSC', 'HQ']),
  contact_number: z.string().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['commander', 'admin']).default('commander'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    // Use service role client for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase URL' },
        { status: 500 }
      )
    }
    
    if (!supabaseServiceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase Service Role Key. Please add SUPABASE_SERVICE_ROLE_KEY to your Vercel environment variables.' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if username already exists
    const { data: existingCommander, error: checkError } = await supabase
      .from('commanders')
      .select('id')
      .eq('username', data.username)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is fine
      console.error('Check username error:', checkError)
      return NextResponse.json(
        { error: 'Error checking username availability' },
        { status: 500 }
      )
    }

    if (existingCommander) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth first
    // Use email format: username@srtrack.local
    const email = `${data.username}@srtrack.local`
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: data.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        username: data.username,
        role: data.role,
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      // Check if user already exists
      if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
        return NextResponse.json(
          { error: 'An account with this username already exists' },
          { status: 400 }
        )
      }
      // Return more specific error message
      const errorMessage = authError.message || 'Failed to create user account'
      return NextResponse.json(
        { error: `Failed to create user account: ${errorMessage}` },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Insert commander record
    // Note: password_hash is stored by Supabase Auth, not in commanders table
    const { error: insertError } = await supabase
      .from('commanders')
      .insert({
        id: authData.user.id, // Use auth user ID
        rank: data.rank,
        full_name: data.full_name,
        company: data.company,
        contact_number: data.contact_number || null,
        username: data.username,
        password_hash: 'supabase_auth', // Placeholder - password managed by Supabase Auth
        role: data.role,
        is_active: true,
      })

    if (insertError) {
      // If insert fails, try to delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      console.error('Insert error:', insertError)
      const errorMessage = insertError.message || 'Failed to create commander record'
      return NextResponse.json(
        { error: `Failed to create commander record: ${errorMessage}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Registration successful. You can now log in.' 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message || 'Invalid request data' },
        { status: 400 }
      )
    }
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

