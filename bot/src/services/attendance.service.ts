import { supabase } from '../config/supabase';
import { AttendanceLog } from '../types/database';
import { getCurrentSGTTime, formatToSGT, getTodaySGT, isPastCutoff } from '../utils/timezone';

export class AttendanceService {
  /**
   * Get current active attendance log for trainee
   */
  static async getActiveLog(traineeId: string): Promise<AttendanceLog | null> {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('trainee_id', traineeId)
      .eq('status', 'IN')
      .is('clock_out_time', null)
      .order('clock_in_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as AttendanceLog | null;
  }

  /**
   * Clock in a trainee
   */
  static async clockIn(traineeId: string, telegramUpdateId: number): Promise<AttendanceLog> {
    // Check if already clocked in
    const activeLog = await this.getActiveLog(traineeId);
    if (activeLog) {
      throw new Error('You are already clocked in');
    }

    // Check if past cutoff
    if (isPastCutoff()) {
      throw new Error('Cannot clock in after 22:00 SGT');
    }

    const clockInTime = getCurrentSGTTime();
    const today = getTodaySGT();

    const { data, error } = await supabase
      .from('attendance_logs')
      .insert({
        trainee_id: traineeId,
        clock_in_time: clockInTime.toISOString(),
        clock_out_time: null,
        status: 'IN',
        date: today,
        is_overdue: false,
        telegram_update_id: telegramUpdateId,
      })
      .select()
      .single();

    if (error) {
      // Check for duplicate update_id (replay attack)
      if (error.code === '23505' && error.message.includes('telegram_update_id')) {
        throw new Error('This action has already been processed');
      }
      throw error;
    }

    return data as AttendanceLog;
  }

  /**
   * Clock out a trainee
   */
  static async clockOut(traineeId: string, telegramUpdateId: number): Promise<AttendanceLog> {
    // Check if currently clocked in
    const activeLog = await this.getActiveLog(traineeId);
    if (!activeLog) {
      throw new Error('You are not currently clocked in');
    }

    const clockOutTime = getCurrentSGTTime();

    // Validate clock out time is after clock in time
    const clockInTime = new Date(activeLog.clock_in_time);
    if (clockOutTime <= clockInTime) {
      throw new Error('Clock out time must be after clock in time');
    }

    const { data, error } = await supabase
      .from('attendance_logs')
      .update({
        clock_out_time: clockOutTime.toISOString(),
        status: 'OUT',
        telegram_update_id: telegramUpdateId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeLog.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as AttendanceLog;
  }

  /**
   * Get trainee's current status
   */
  static async getStatus(traineeId: string): Promise<{ status: 'IN' | 'OUT'; log: AttendanceLog | null }> {
    const activeLog = await this.getActiveLog(traineeId);
    return {
      status: activeLog ? 'IN' : 'OUT',
      log: activeLog,
    };
  }
}

