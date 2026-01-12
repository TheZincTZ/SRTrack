import { supabase } from '../config/supabase';
import { formatToSGT } from '../utils/timezone';
import { NotificationService } from './notification.service';
import { bot } from '../bot';

/**
 * Mark overdue trainees and send notifications
 * Should be run daily at 22:05 SGT
 */
export class OverdueCheckService {
  static async checkAndMarkOverdue(): Promise<void> {
    const today = formatToSGT(new Date(), 'yyyy-MM-dd');

    // Find all active clock-ins from today
    const { data: overdueLogs, error } = await supabase
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
      .eq('status', 'IN')
      .eq('date', today)
      .is('clock_out_time', null)
      .eq('is_overdue', false);

    if (error) {
      console.error('Error fetching overdue logs:', error);
      return;
    }

    if (!overdueLogs || overdueLogs.length === 0) {
      console.log('No overdue trainees found');
      return;
    }

    // Mark as overdue and send notifications
    for (const log of overdueLogs) {
      const trainee = log.trainees as any;

      // Update log to mark as overdue
      await supabase
        .from('attendance_logs')
        .update({ is_overdue: true })
        .eq('id', log.id);

      // Send notification to commanders
      await NotificationService.notifyCommanders(
        bot,
        trainee.company,
        trainee.rank,
        trainee.full_name,
        trainee.identification_number,
        'overdue'
      );
    }

    console.log(`Marked ${overdueLogs.length} trainees as overdue`);
  }
}

