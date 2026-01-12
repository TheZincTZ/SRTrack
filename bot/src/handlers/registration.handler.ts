import TelegramBot from 'node-telegram-bot-api';
import { TraineeService } from '../services/trainee.service';
import { formatToSGT } from '../utils/timezone';

interface RegistrationState {
  telegramUserId: number;
  step: 'rank' | 'name' | 'number' | 'company' | 'complete';
  data: {
    rank?: string;
    full_name?: string;
    identification_number?: string;
    company?: 'A' | 'B' | 'C' | 'Support' | 'MSC' | 'HQ';
  };
}

// In-memory storage for registration state (use Redis in production)
const registrationStates = new Map<number, RegistrationState>();

const VALID_COMPANIES = ['A', 'B', 'C', 'Support', 'MSC', 'HQ'] as const;

export class RegistrationHandler {
  /**
   * Start registration process
   */
  static async startRegistration(bot: TelegramBot, chatId: number, telegramUserId: number): Promise<void> {
    const existing = await TraineeService.findByTelegramUserId(telegramUserId);
    if (existing) {
      await bot.sendMessage(chatId, 'You are already registered!');
      return;
    }

    registrationStates.set(telegramUserId, {
      telegramUserId,
      step: 'rank',
      data: {},
    });

    await bot.sendMessage(
      chatId,
      '📝 Registration\n\nPlease provide your details:\n\n1. Rank (e.g., PVT, CPL, SGT):'
    );
  }

  /**
   * Handle registration step
   */
  static async handleRegistrationStep(
    bot: TelegramBot,
    chatId: number,
    telegramUserId: number,
    text: string
  ): Promise<boolean> {
    const state = registrationStates.get(telegramUserId);
    if (!state || state.step === 'complete') {
      return false;
    }

    switch (state.step) {
      case 'rank':
        state.data.rank = text.trim();
        state.step = 'name';
        await bot.sendMessage(chatId, '2. Full Name:');
        break;

      case 'name':
        state.data.full_name = text.trim();
        state.step = 'number';
        await bot.sendMessage(chatId, '3. Identification Number:');
        break;

      case 'number':
        state.data.identification_number = text.trim();
        state.step = 'company';
        await bot.sendMessage(
          chatId,
          '4. Company:\n\nPlease select your company:',
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'A', callback_data: 'reg_company_A' }],
                [{ text: 'B', callback_data: 'reg_company_B' }],
                [{ text: 'C', callback_data: 'reg_company_C' }],
                [{ text: 'Support', callback_data: 'reg_company_Support' }],
                [{ text: 'MSC', callback_data: 'reg_company_MSC' }],
                [{ text: 'HQ', callback_data: 'reg_company_HQ' }],
              ],
            },
          }
        );
        break;

      case 'company':
        // This is handled via callback query
        return false;
    }

    return true;
  }

  /**
   * Handle company selection
   */
  static async handleCompanySelection(
    bot: TelegramBot,
    chatId: number,
    telegramUserId: number,
    company: string
  ): Promise<void> {
    const state = registrationStates.get(telegramUserId);
    if (!state || state.step !== 'company') {
      return;
    }

    if (!VALID_COMPANIES.includes(company as any)) {
      await bot.sendMessage(chatId, 'Invalid company selected. Please try again.');
      return;
    }

    state.data.company = company as typeof state.data.company;
    state.step = 'complete';

    try {
      // Register trainee
      const trainee = await TraineeService.register({
        telegram_user_id: telegramUserId,
        rank: state.data.rank!,
        full_name: state.data.full_name!,
        identification_number: state.data.identification_number!,
        company: state.data.company!,
      });

      // Clear registration state
      registrationStates.delete(telegramUserId);

      await bot.sendMessage(
        chatId,
        `✅ Registration successful!\n\n` +
        `Rank: ${trainee.rank}\n` +
        `Name: ${trainee.full_name}\n` +
        `Number: ${trainee.identification_number}\n` +
        `Company: ${trainee.company}\n\n` +
        `You can now use the clock in/out buttons.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🟢 Clock In', callback_data: 'clock_in' }],
              [{ text: '🔴 Clock Out', callback_data: 'clock_out' }],
            ],
          },
        }
      );
    } catch (error: any) {
      registrationStates.delete(telegramUserId);
      await bot.sendMessage(
        chatId,
        `❌ Registration failed: ${error.message}\n\nPlease try again with /register`
      );
    }
  }

  /**
   * Check if user is in registration flow
   */
  static isInRegistration(telegramUserId: number): boolean {
    const state = registrationStates.get(telegramUserId);
    return state !== undefined && state.step !== 'complete';
  }
}

