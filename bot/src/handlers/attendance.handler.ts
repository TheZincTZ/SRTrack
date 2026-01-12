import TelegramBot from 'node-telegram-bot-api';
import { TraineeService } from '../services/trainee.service';
import { AttendanceService } from '../services/attendance.service';
import { NotificationService } from '../services/notification.service';
import { formatToSGT } from '../utils/timezone';

export class AttendanceHandler {
  /**
   * Handle clock in action
   */
  static async handleClockIn(bot: TelegramBot, chatId: number, telegramUserId: number, updateId: number): Promise<void> {
    try {
      // Find trainee
      const trainee = await TraineeService.findByTelegramUserId(telegramUserId);
      if (!trainee) {
        await bot.sendMessage(
          chatId,
          '❌ You are not registered. Please register first using /register'
        );
        return;
      }

      // Clock in
      const log = await AttendanceService.clockIn(trainee.id, updateId);
      const clockInTime = formatToSGT(new Date(log.clock_in_time), 'HH:mm:ss');

      await bot.sendMessage(
        chatId,
        `✅ Clocked in successfully!\n\nTime: ${clockInTime} SGT`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔴 Clock Out', callback_data: 'clock_out' }],
            ],
          },
        }
      );

      // Notify commanders
      await NotificationService.notifyCommanders(
        bot,
        trainee.company,
        trainee.rank,
        trainee.full_name,
        trainee.identification_number,
        'clock_in',
        new Date(log.clock_in_time)
      );
    } catch (error: any) {
      await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
  }

  /**
   * Handle clock out action
   */
  static async handleClockOut(bot: TelegramBot, chatId: number, telegramUserId: number, updateId: number): Promise<void> {
    try {
      // Find trainee
      const trainee = await TraineeService.findByTelegramUserId(telegramUserId);
      if (!trainee) {
        await bot.sendMessage(
          chatId,
          '❌ You are not registered. Please register first using /register'
        );
        return;
      }

      // Clock out
      const log = await AttendanceService.clockOut(trainee.id, updateId);
      const clockOutTime = formatToSGT(new Date(log.clock_out_time!), 'HH:mm:ss');
      const clockInTime = formatToSGT(new Date(log.clock_in_time), 'HH:mm:ss');

      await bot.sendMessage(
        chatId,
        `✅ Clocked out successfully!\n\n` +
        `Clock In: ${clockInTime} SGT\n` +
        `Clock Out: ${clockOutTime} SGT`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🟢 Clock In', callback_data: 'clock_in' }],
            ],
          },
        }
      );

      // Notify commanders
      await NotificationService.notifyCommanders(
        bot,
        trainee.company,
        trainee.rank,
        trainee.full_name,
        trainee.identification_number,
        'clock_out',
        new Date(log.clock_out_time!)
      );
    } catch (error: any) {
      await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
  }

  /**
   * Get current status
   */
  static async handleStatus(bot: TelegramBot, chatId: number, telegramUserId: number): Promise<void> {
    try {
      const trainee = await TraineeService.findByTelegramUserId(telegramUserId);
      if (!trainee) {
        await bot.sendMessage(
          chatId,
          '❌ You are not registered. Please register first using /register'
        );
        return;
      }

      const { status, log } = await AttendanceService.getStatus(trainee.id);

      if (status === 'IN' && log) {
        const clockInTime = formatToSGT(new Date(log.clock_in_time), 'HH:mm:ss');
        await bot.sendMessage(
          chatId,
          `📊 Current Status: IN\n\nClock In: ${clockInTime} SGT`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔴 Clock Out', callback_data: 'clock_out' }],
              ],
            },
          }
        );
      } else {
        await bot.sendMessage(
          chatId,
          `📊 Current Status: OUT\n\nYou are not currently clocked in.`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🟢 Clock In', callback_data: 'clock_in' }],
              ],
            },
          }
        );
      }
    } catch (error: any) {
      await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
  }

  /**
   * Get keyboard based on current status
   */
  static async getStatusKeyboard(traineeId: string): Promise<any> {
    const { status } = await AttendanceService.getStatus(traineeId);

    if (status === 'IN') {
      return {
        inline_keyboard: [
          [{ text: '🔴 Clock Out', callback_data: 'clock_out' }],
        ],
      };
    } else {
      return {
        inline_keyboard: [
          [{ text: '🟢 Clock In', callback_data: 'clock_in' }],
        ],
      };
    }
  }
}

