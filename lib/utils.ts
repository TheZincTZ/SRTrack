import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Timezone utilities for SGT (UTC+8)
export function getSGTDate(): Date {
  const now = new Date()
  const sgtOffset = 8 * 60 // UTC+8 in minutes
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  return new Date(utc + (sgtOffset * 60000))
}

export function formatSGTDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function getSGTTimeString(): string {
  return getSGTDate().toISOString()
}

export function isAfter10PM(): boolean {
  const sgt = getSGTDate()
  return sgt.getHours() >= 22
}

