import { formatInTimeZone, utcToZonedTime } from 'date-fns-tz';
import env from '../config/env';

const TIMEZONE = env.TIMEZONE;

/**
 * Get current time in SGT
 */
export function getCurrentSGTTime(): Date {
  return utcToZonedTime(new Date(), TIMEZONE);
}

/**
 * Format date to SGT timezone string
 */
export function formatToSGT(date: Date, format: string = 'yyyy-MM-dd HH:mm:ss'): string {
  return formatInTimeZone(date, TIMEZONE, format);
}

/**
 * Check if current time is past daily cutoff (22:00 SGT)
 */
export function isPastCutoff(): boolean {
  const now = getCurrentSGTTime();
  const hour = now.getHours();
  return hour >= 22;
}

/**
 * Get today's date in SGT
 */
export function getTodaySGT(): string {
  return formatToSGT(new Date(), 'yyyy-MM-dd');
}

