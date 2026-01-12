import { supabase } from '../config/supabase';
import { formatToSGT } from '../utils/timezone';
import TelegramBot from 'node-telegram-bot-api';

export class NotificationService {
  /**
   * Send notification to commanders about trainee action
   */
  static async notifyCommanders(
    bot: TelegramBot,
    traineeCompany: string,
    traineeRank: string,
    traineeName: string,
    traineeNumber: string,
    action: 'clock_in' | 'clock_out' | 'overdue',
    timestamp?: Date
  ): Promise<void> {
    // Get all active commanders for the trainee's company
    // Note: This assumes commanders table has telegram_user_id field
    // If using Supabase Auth, you'll need to join with auth.users
    const { data: commanders, error } = await supabase
      .from('commanders')
      .select('id, rank, full_name')
      .eq('company', traineeCompany)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching commanders:', error);
      return;
    }

    if (!commanders || commanders.length === 0) {
      return; // No commanders to notify
    }

    // Compose message
    let message = '';
    const timeStr = timestamp ? formatToSGT(timestamp, 'HH:mm:ss') : formatToSGT(new Date(), 'HH:mm:ss');

    switch (action) {
      case 'clock_in':
        message = `🟢 Clock In\n\n` +
          `Rank: ${traineeRank}\n` +
          `Name: ${traineeName}\n` +
          `Number: ${traineeNumber}\n` +
          `Company: ${traineeCompany}\n` +
          `Time: ${timeStr} SGT`;
        break;
      case 'clock_out':
        message = `🔴 Clock Out\n\n` +
          `Rank: ${traineeRank}\n` +
          `Name: ${traineeName}\n` +
          `Number: ${traineeNumber}\n` +
          `Company: ${traineeCompany}\n` +
          `Time: ${timeStr} SGT`;
        break;
      case 'overdue':
        message = `⚠️ OVERDUE: Trainee has not clocked out\n\n` +
          `Rank: ${traineeRank}\n` +
          `Name: ${traineeName}\n` +
          `Number: ${traineeNumber}\n` +
          `Company: ${traineeCompany}\n` +
          `Cutoff time: 22:00 SGT`;
        break;
    }

    // Send notifications (with idempotency check)
    // Note: This requires commanders to have telegram_user_id stored
    // For now, we'll skip actual sending and just log
    // You'll need to implement commander Telegram ID storage
    for (const commander of commanders) {
      try {
        // Get trainee ID for notification logging
        const { data: trainee } = await supabase
          .from('trainees')
          .select('id')
          .eq('identification_number', traineeNumber)
          .single();

        if (!trainee) continue;

        // Check if notification already sent (idempotency)
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('commander_id', commander.id)
          .eq('trainee_id', trainee.id)
          .eq('notification_type', action)
          .eq('date', formatToSGT(new Date(), 'yyyy-MM-dd'))
          .maybeSingle();

        if (existing) {
          continue; // Already notified
        }

        // TODO: Send notification via Telegram
        // For now, we'll need to store commander telegram_user_id in commanders table
        // await bot.sendMessage(commander.telegram_user_id, message);

        // Log notification
        await supabase.from('notifications').insert({
          commander_id: commander.id,
          trainee_id: trainee.id,
          notification_type: action,
          date: formatToSGT(new Date(), 'yyyy-MM-dd'),
          message_text: message,
        });

        console.log(`Notification logged for commander ${commander.id}`);
      } catch (error) {
        console.error(`Failed to process notification for commander ${commander.id}:`, error);
        // Continue with other commanders
      }
    }
  }
}

