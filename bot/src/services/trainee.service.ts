import { supabase } from '../config/supabase';
import { Trainee } from '../types/database';

export class TraineeService {
  /**
   * Find trainee by Telegram User ID
   */
  static async findByTelegramUserId(telegramUserId: number): Promise<Trainee | null> {
    const { data, error } = await supabase
      .from('trainees')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    return data as Trainee;
  }

  /**
   * Register a new trainee
   */
  static async register(data: {
    telegram_user_id: number;
    rank: string;
    full_name: string;
    identification_number: string;
    company: 'A' | 'B' | 'C' | 'Support' | 'MSC' | 'HQ';
  }): Promise<Trainee> {
    // Check for duplicate telegram_user_id
    const existing = await this.findByTelegramUserId(data.telegram_user_id);
    if (existing) {
      throw new Error('You are already registered');
    }

    // Check for duplicate identification_number
    const { data: existingId, error: idError } = await supabase
      .from('trainees')
      .select('id')
      .eq('identification_number', data.identification_number)
      .single();

    if (existingId) {
      throw new Error('This identification number is already registered');
    }

    const { data: trainee, error } = await supabase
      .from('trainees')
      .insert({
        telegram_user_id: data.telegram_user_id,
        rank: data.rank,
        full_name: data.full_name,
        identification_number: data.identification_number,
        company: data.company,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return trainee as Trainee;
  }
}

