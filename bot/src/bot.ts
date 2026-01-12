import TelegramBot, { Message, CallbackQuery } from 'node-telegram-bot-api';
import env from './config/env';
import { RegistrationHandler } from './handlers/registration.handler';
import { AttendanceHandler } from './handlers/attendance.handler';
import { TraineeService } from './services/trainee.service';

// Create bot instance (polling disabled, using webhook)
export const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: false });

/**
 * Initialize bot handlers
 */
export function initializeBot(): void {
  // Start command
  bot.onText(/\/start/, async (msg: Message) => {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from!.id;

    try {
      const trainee = await TraineeService.findByTelegramUserId(telegramUserId);
      
      if (!trainee) {
        await bot.sendMessage(
          chatId,
          '👋 Welcome to SRTrack!\n\nYou are not registered yet. Please register using /register',
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '📝 Register', callback_data: 'start_register' }],
              ],
            },
          }
        );
      } else {
        await AttendanceHandler.handleStatus(bot, chatId, telegramUserId);
      }
    } catch (error: any) {
      await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
  });

  // Register command
  bot.onText(/\/register/, async (msg: Message) => {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from!.id;
    await RegistrationHandler.startRegistration(bot, chatId, telegramUserId);
  });

  // Status command
  bot.onText(/\/status/, async (msg: Message) => {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from!.id;
    await AttendanceHandler.handleStatus(bot, chatId, telegramUserId);
  });

  // Handle callback queries (buttons)
  bot.on('callback_query', async (query: CallbackQuery) => {
    const chatId = query.message!.chat.id;
    const telegramUserId = query.from.id;
    const data = query.data!;

    // Acknowledge callback
    await bot.answerCallbackQuery(query.id);

    try {
      // Registration flow
      if (data === 'start_register') {
        await RegistrationHandler.startRegistration(bot, chatId, telegramUserId);
        return;
      }

      if (data.startsWith('reg_company_')) {
        const company = data.replace('reg_company_', '');
        await RegistrationHandler.handleCompanySelection(bot, chatId, telegramUserId, company);
        return;
      }

      // Attendance actions
      if (data === 'clock_in') {
        await AttendanceHandler.handleClockIn(bot, chatId, telegramUserId, query.message!.message_id);
        return;
      }

      if (data === 'clock_out') {
        await AttendanceHandler.handleClockOut(bot, chatId, telegramUserId, query.message!.message_id);
        return;
      }
    } catch (error: any) {
      await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
  });

  // Handle text messages (for registration flow)
  bot.on('message', async (msg: Message) => {
    // Skip if command or callback
    if (msg.text?.startsWith('/') || msg.text?.startsWith('reg_company_')) {
      return;
    }

    const chatId = msg.chat.id;
    const telegramUserId = msg.from!.id;
    const text = msg.text;

    if (!text) return;

    // Check if in registration flow
    if (RegistrationHandler.isInRegistration(telegramUserId)) {
      await RegistrationHandler.handleRegistrationStep(bot, chatId, telegramUserId, text);
    }
  });

  console.log('✅ Bot handlers initialized');
}

export default bot;
