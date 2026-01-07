import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { validateCommanderData, sanitizeInput } from '@/lib/validation'

// This endpoint is for registering commanders (admin use only)
// In production, this should be protected or run manually via Supabase dashboard
export async function POST(request: NextRequest) {
  try {
    // Optional: Add API key protection
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.COMMANDER_REGISTRATION_API_KEY
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rank_name, username, password, company, contact_number } = body

    // Sanitize inputs
    const sanitizedData = {
      rank_name: sanitizeInput(rank_name || ''),
      username: sanitizeInput(username || ''),
      password: password || '',
      company: sanitizeInput(company || ''),
      contact_number: contact_number ? sanitizeInput(contact_number) : null,
    }

    // Validate inputs
    const validation = validateCommanderData(sanitizedData)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid input data' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Check if username already exists
    const { data: existingCommander, error: checkError } = await supabase
      .from('commanders')
      .select('*')
      .eq('username', sanitizedData.username)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing commander:', checkError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (existingCommander) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    // Create auth user with email format: username@srtrack.local
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `${sanitizedData.username}@srtrack.local`,
      password: sanitizedData.password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      console.error('Auth creation error:', authError)
      return NextResponse.json(
        { error: 'Failed to create user account', details: authError?.message },
        { status: 500 }
      )
    }

    // Create commander record
    const { data: commander, error: commanderError } = await supabase
      .from('commanders')
      .insert({
        id: authData.user.id,
        rank_name: sanitizedData.rank_name,
        username: sanitizedData.username,
        company: sanitizedData.company,
        contact_number: sanitizedData.contact_number,
      })
      .select()
      .single()

    if (commanderError) {
      // Rollback: delete auth user if commander creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (deleteError) {
        console.error('Failed to rollback auth user:', deleteError)
      }
      console.error('Commander creation error:', commanderError)
      return NextResponse.json(
        { error: 'Failed to create commander record', details: commanderError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      commander: {
        id: commander.id,
        rank_name: commander.rank_name,
        username: commander.username,
        company: commander.company,
      },
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

