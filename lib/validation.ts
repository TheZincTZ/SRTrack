import type { CompanyType } from './types'

export const VALID_COMPANIES: CompanyType[] = ['A', 'B', 'C', 'Support', 'MSC', 'HQ']

export function validateCompany(company: string): company is CompanyType {
  return VALID_COMPANIES.includes(company as CompanyType)
}

export function validateTelegramUserId(userId: any): userId is number {
  return typeof userId === 'number' && userId > 0
}

export function validateStringInput(input: any, minLength = 1, maxLength = 255): input is string {
  return typeof input === 'string' && input.length >= minLength && input.length <= maxLength
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function validateRegistrationData(data: {
  rank?: any
  name?: any
  number?: any
  company?: any
}): { valid: boolean; error?: string } {
  if (!validateStringInput(data.rank, 1, 100)) {
    return { valid: false, error: 'Invalid rank' }
  }

  if (!validateStringInput(data.name, 1, 255)) {
    return { valid: false, error: 'Invalid name' }
  }

  if (!validateStringInput(data.number, 1, 50)) {
    return { valid: false, error: 'Invalid number' }
  }

  if (!validateCompany(data.company)) {
    return { valid: false, error: 'Invalid company' }
  }

  return { valid: true }
}

export function validateCommanderData(data: {
  rank_name?: any
  username?: any
  password?: any
  company?: any
  contact_number?: any
}): { valid: boolean; error?: string } {
  if (!validateStringInput(data.rank_name, 1, 100)) {
    return { valid: false, error: 'Invalid rank_name' }
  }

  if (!validateStringInput(data.username, 3, 100)) {
    return { valid: false, error: 'Username must be 3-100 characters' }
  }

  if (!validateStringInput(data.password, 8, 128)) {
    return { valid: false, error: 'Password must be 8-128 characters' }
  }

  if (!validateCompany(data.company)) {
    return { valid: false, error: 'Invalid company' }
  }

  if (data.contact_number && !validateStringInput(data.contact_number, 1, 50)) {
    return { valid: false, error: 'Invalid contact_number' }
  }

  return { valid: true }
}

