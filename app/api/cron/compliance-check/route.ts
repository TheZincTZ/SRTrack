import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSGTDate, formatSGTDate, isAfter10PM } from '@/lib/utils'

// This endpoint runs at 10:00 PM SGT daily to check for compliance violations
// Can be triggered by Vercel Cron or external cron service
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if set
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Check current SGT time
    const sgtNow = getSGTDate()
    const sgtHour = sgtNow.getHours()
    
    // Only process if it's 10 PM SGT (22:00) or later
    // Note: Cron runs at 14:00 UTC which is 22:00 SGT
    if (sgtHour < 22) {
      return NextResponse.json({
        message: `Not yet 10:00 PM SGT. Current SGT time: ${sgtNow.toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}. Skipping compliance check.`,
        skipped: true,
        currentSGT: sgtNow.toISOString(),
      })
    }

    const supabase = createServiceClient()
    const today = formatSGTDate(getSGTDate())

    // Find all sessions that are CLOCKED_IN but not clocked out today
    const { data: violations, error: violationsError } = await supabase
      .from('srt_sessions')
      .select(`
        *,
        srt_user:srt_users!srt_sessions_srt_user_id_fkey (
          id,
          name,
          rank,
          company
        )
      `)
      .eq('date', today)
      .eq('status', 'CLOCKED_IN')
      .is('clock_out_time', null)

    if (violationsError) {
      console.error('Error fetching violations:', violationsError)
      return NextResponse.json(
        { error: 'Failed to fetch violations' },
        { status: 500 }
      )
    }

    if (!violations || violations.length === 0) {
      return NextResponse.json({
        message: 'No violations found. All users have clocked out.',
        violations: 0,
      })
    }

    // Update all violation sessions to RED status
    const violationIds = violations.map(v => v.id)
    const { error: updateError } = await supabase
      .from('srt_sessions')
      .update({ status: 'RED' })
      .in('id', violationIds)

    if (updateError) {
      console.error('Error updating violations:', updateError)
      return NextResponse.json(
        { error: 'Failed to update violations' },
        { status: 500 }
      )
    }

    // Group violations by company for notifications
    const violationsByCompany: Record<string, typeof violations> = {}
    for (const violation of violations) {
      const company = (violation.srt_user as any).company
      if (!violationsByCompany[company]) {
        violationsByCompany[company] = []
      }
      violationsByCompany[company].push(violation)
    }

    // Get commanders for each company and prepare notifications
    // Note: In a real implementation, you would send notifications via email, SMS, or Telegram
    const notifications: Array<{ company: string; commanderCount: number; violations: number }> = []

    for (const [company, companyViolations] of Object.entries(violationsByCompany)) {
      const { data: commanders } = await supabase
        .from('commanders')
        .select('*')
        .eq('company', company)

      notifications.push({
        company,
        commanderCount: commanders?.length || 0,
        violations: companyViolations.length,
      })

      // TODO: Send actual notifications to commanders
      // This could be via:
      // - Email (using a service like SendGrid, Resend, etc.)
      // - SMS (using Twilio, etc.)
      // - Telegram (if commanders have Telegram accounts)
      // - Push notifications (if you have a mobile app)
    }

    return NextResponse.json({
      message: `Compliance check completed. Found ${violations.length} violation(s).`,
      violations: violations.length,
      violationsByCompany,
      notifications,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Compliance check error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

