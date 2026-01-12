import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE || 'Asia/Singapore';

export function formatToSGT(date: Date | string, format: string = 'yyyy-MM-dd HH:mm:ss'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, TIMEZONE, format);
}

export function getCurrentSGTTime(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

export function isPastCutoff(): boolean {
  const now = getCurrentSGTTime();
  return now.getHours() >= 22;
}

