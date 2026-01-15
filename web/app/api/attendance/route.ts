import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCommander } from '@/lib/auth'
import { formatToSGT, isPastCutoff } from '@/lib/utils/timezone'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const commander = await getCommander()
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const company = searchParams.get('company')
    const date = searchParams.get('date') || formatToSGT(new Date(), 'yyyy-MM-dd')

    // Build query
    let query = supabase
      .from('attendance_logs')
      .select(`
        *,
        trainees (
          id,
          rank,
          full_name,
          identification_number,
          company
        )
      `)
      .eq('date', date)
      .order('clock_in_time', { ascending: false })

    // Apply company filter for commanders
    if (commander.role === 'commander') {
      query = query.eq('trainees.company', commander.company)
    } else if (company) {
      query = query.eq('trainees.company', company)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    // Process data and add overdue flag
    const processedData = data?.map((log: any) => {
      const trainee = log.trainees
      const clockInTime = log.clock_in_time ? new Date(log.clock_in_time) : null
      const clockOutTime = log.clock_out_time ? new Date(log.clock_out_time) : null
      
      // Check if overdue
      const isOverdue = 
        log.status === 'IN' &&
        !clockOutTime &&
        log.date === formatToSGT(new Date(), 'yyyy-MM-dd') &&
        isPastCutoff()

      return {
        id: log.id,
        rank: trainee?.rank,
        name: trainee?.full_name,
        number: trainee?.identification_number,
        company: trainee?.company,
        clockInTime: clockInTime ? formatToSGT(clockInTime, 'HH:mm:ss') : null,
        clockOutTime: clockOutTime ? formatToSGT(clockOutTime, 'HH:mm:ss') : null,
        status: log.status,
        isOverdue,
      }
    }) || []

    return NextResponse.json({
      data: processedData,
      total: processedData.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance' },
      { status: 500 }
    )
  }
}

