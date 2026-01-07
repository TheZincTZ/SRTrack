import { NextRequest, NextResponse } from 'next/server'
import TelegramBot from 'node-telegram-bot-api'
import { createServiceClient } from '@/lib/supabase/server'
import { getSGTDate, formatSGTDate, getSGTTimeString } from '@/lib/utils'
import { validateRegistrationData, validateTelegramUserId, sanitizeInput } from '@/lib/validation'
import type { CompanyType } from '@/lib/types'

// Initialize bot (webhook mode) - lazy initialization for serverless
let bot: TelegramBot | null = null

function getBot(): TelegramBot {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set')
    }
    bot = new TelegramBot(token, { webHook: true })
    setupBotHandlers(bot)
  }
  return bot
}

// Verify webhook secret
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if set
    if (WEBHOOK_SECRET) {
      const secret = request.headers.get('x-telegram-bot-api-secret-token')
      if (secret !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    
    // Validate Telegram update structure
    if (!body || typeof body !== 'object' || !body.update_id) {
      return NextResponse.json({ error: 'Invalid update format' }, { status: 400 })
    }
    
    // Process update
    const botInstance = getBot()
    await botInstance.processUpdate(body)
    
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

function setupBotHandlers(bot: TelegramBot) {
  // Handle commands and callbacks
  bot.onText(/\/start/, async (msg) => {
  try {
    const chatId = msg.chat.id
    const telegramUserId = msg.from?.id

    if (!validateTelegramUserId(telegramUserId)) {
      await bot.sendMessage(chatId, 'Error: Could not identify your Telegram user ID.')
      return
    }

    const supabase = createServiceClient()
    
    // Check if user is registered
    const { data: existingUser, error } = await supabase
      .from('srt_users')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking user:', error)
      await bot.sendMessage(chatId, 'An error occurred. Please try again later.')
      return
    }

    if (existingUser) {
      // User is registered, show clock in/out options
      await showMainMenu(bot, chatId, telegramUserId, supabase)
    } else {
      // User not registered, show registration prompt
      await bot.sendMessage(
        chatId,
        'Welcome to SRTrack! You need to register first.\n\nPlease use /register to start registration.'
      )
    }
  } catch (error) {
    console.error('Start command error:', error)
  }
})

  bot.onText(/\/register/, async (msg) => {
    try {
      const chatId = msg.chat.id
      const telegramUserId = msg.from?.id

      if (!validateTelegramUserId(telegramUserId)) {
        await bot.sendMessage(chatId, 'Error: Could not identify your Telegram user ID.')
        return
      }

  const supabase = createServiceClient()
  
  // Check if already registered
  const { data: existingUser } = await supabase
    .from('srt_users')
    .select('*')
    .eq('telegram_user_id', telegramUserId)
    .single()

  if (existingUser) {
    await bot.sendMessage(chatId, 'You are already registered! Use /start to access the main menu.')
    return
  }

      // Start registration flow
      await bot.sendMessage(
        chatId,
        'Please provide your registration details in the following format:\n\n' +
        '/register_details\n' +
        'Rank: [Your Rank]\n' +
        'Name: [Your Full Name]\n' +
        'Number: [Your ID Number]\n' +
        'Company: [A/B/C/Support/MSC/HQ]'
      )
    } catch (error) {
      console.error('Register command error:', error)
    }
  })

  bot.onText(/\/register_details/, async (msg) => {
    try {
    const chatId = msg.chat.id
    const telegramUserId = msg.from?.id

    if (!validateTelegramUserId(telegramUserId)) {
      await bot.sendMessage(chatId, 'Error: Could not identify your Telegram user ID.')
      return
    }

    const text = msg.text || ''
    const lines = text.split('\n').map(l => l.trim())

    let rank = ''
    let name = ''
    let number = ''
    let company: CompanyType | null = null

    for (const line of lines) {
      if (line.startsWith('Rank:')) {
        rank = sanitizeInput(line.replace('Rank:', '').trim())
      } else if (line.startsWith('Name:')) {
        name = sanitizeInput(line.replace('Name:', '').trim())
      } else if (line.startsWith('Number:')) {
        number = sanitizeInput(line.replace('Number:', '').trim())
      } else if (line.startsWith('Company:')) {
        const companyStr = sanitizeInput(line.replace('Company:', '').trim())
        const validCompanies: CompanyType[] = ['A', 'B', 'C', 'Support', 'MSC', 'HQ']
        if (validCompanies.includes(companyStr as CompanyType)) {
          company = companyStr as CompanyType
        }
      }
    }

    // Validate all fields
    const validation = validateRegistrationData({ rank, name, number, company })
    if (!validation.valid) {
      await bot.sendMessage(
        chatId,
        `Registration failed: ${validation.error}\n\nPlease provide all fields correctly:\n\n` +
        '/register_details\n' +
        'Rank: [Your Rank]\n' +
        'Name: [Your Full Name]\n' +
        'Number: [Your ID Number]\n' +
        'Company: [A/B/C/Support/MSC/HQ]'
      )
      return
    }

    const supabase = createServiceClient()

    // Check for duplicate
    const { data: existingUser, error: checkError } = await supabase
      .from('srt_users')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError)
      await bot.sendMessage(chatId, 'An error occurred. Please try again later.')
      return
    }

    if (existingUser) {
      await bot.sendMessage(chatId, 'You are already registered!')
      return
    }

    // Create user
    const { error } = await supabase
      .from('srt_users')
      .insert({
        telegram_user_id: telegramUserId,
        rank,
        name,
        number,
        company,
      })

    if (error) {
      console.error('Registration error:', error)
      if (error.code === '23505') { // Unique violation
        await bot.sendMessage(chatId, 'Registration failed: This Telegram account is already registered.')
      } else {
        await bot.sendMessage(chatId, 'Registration failed. Please try again or contact support.')
      }
      return
    }

    await bot.sendMessage(chatId, 'Registration successful! Use /start to access the main menu.')
    } catch (error) {
      console.error('Registration details error:', error)
    }
  })

  // Handle callback queries (button presses)
  bot.on('callback_query', async (query) => {
    const chatId = query.message?.chat.id
    const telegramUserId = query.from.id
    const data = query.data

    if (!chatId || !data) return

    const supabase = createServiceClient()

    try {
      if (data === 'clock_in') {
        await handleClockIn(bot, chatId, telegramUserId, supabase)
      } else if (data === 'clock_out') {
        await handleClockOut(bot, chatId, telegramUserId, supabase)
      } else if (data === 'status') {
        await handleStatus(bot, chatId, telegramUserId, supabase)
      } else if (data === 'main_menu') {
        await showMainMenu(bot, chatId, telegramUserId, supabase)
      }

      // Answer callback query to remove loading state
      await bot.answerCallbackQuery(query.id)
    } catch (error) {
      console.error('Callback error:', error)
      await bot.answerCallbackQuery(query.id, { text: 'An error occurred', show_alert: true })
    }
  })
}

async function showMainMenu(bot: TelegramBot, chatId: number, telegramUserId: number, supabase: any) {
  // Check current status
  const { data: user } = await supabase
    .from('srt_users')
    .select('*')
    .eq('telegram_user_id', telegramUserId)
    .single()

  if (!user) {
    await bot.sendMessage(chatId, 'User not found. Please register first using /register')
    return
  }

  // Check for active session
  const today = formatSGTDate(getSGTDate())
  const { data: activeSession } = await supabase
    .from('srt_sessions')
    .select('*')
    .eq('srt_user_id', user.id)
    .eq('date', today)
    .eq('status', 'CLOCKED_IN')
    .single()

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: activeSession ? '✅ CLOCKED IN' : '🕐 CLOCK IN',
          callback_data: 'clock_in',
          disabled: !!activeSession
        }
      ],
      [
        {
          text: activeSession ? '🕐 CLOCK OUT' : '❌ CLOCK OUT (Not Available)',
          callback_data: 'clock_out',
          disabled: !activeSession
        }
      ],
      [
        {
          text: '📊 VIEW STATUS',
          callback_data: 'status'
        }
      ]
    ]
  }

  const statusText = activeSession
    ? `\n\nCurrent Status: CLOCKED IN\nClock In Time: ${new Date(activeSession.clock_in_time).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}`
    : '\n\nCurrent Status: NOT CLOCKED IN'

  await bot.sendMessage(
    chatId,
    `SRTrack Main Menu${statusText}\n\nSelect an action:`,
    { reply_markup: keyboard }
  )
}

async function handleClockIn(bot: TelegramBot, chatId: number, telegramUserId: number, supabase: any) {
  // Get user
  const { data: user } = await supabase
    .from('srt_users')
    .select('*')
    .eq('telegram_user_id', telegramUserId)
    .single()

  if (!user) {
    await bot.sendMessage(chatId, 'User not found. Please register first.')
    return
  }

  // Check if already clocked in today
  const today = formatSGTDate(getSGTDate())
  const { data: existingSession } = await supabase
    .from('srt_sessions')
    .select('*')
    .eq('srt_user_id', user.id)
    .eq('date', today)
    .eq('status', 'CLOCKED_IN')
    .single()

  if (existingSession) {
    await bot.sendMessage(
      chatId,
      'You are already clocked in today!\n\n' +
      `Clock In Time: ${new Date(existingSession.clock_in_time).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}`
    )
    return
  }

  // Create clock-in session
  const clockInTime = getSGTTimeString()
  const { error } = await supabase
    .from('srt_sessions')
    .insert({
      srt_user_id: user.id,
      clock_in_time: clockInTime,
      date: today,
      status: 'CLOCKED_IN',
    })

  if (error) {
    console.error('Clock in error:', error)
    await bot.sendMessage(chatId, 'Failed to clock in. Please try again.')
    return
  }

  await bot.sendMessage(
    chatId,
    `✅ Successfully clocked in!\n\n` +
    `Time: ${new Date(clockInTime).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}\n` +
    `Date: ${today}\n\n` +
    `Remember to clock out when you're done!`
  )

  // Show updated menu
  await showMainMenu(bot, chatId, telegramUserId, supabase)
}

async function handleClockOut(bot: TelegramBot, chatId: number, telegramUserId: number, supabase: any) {
  // Get user
  const { data: user } = await supabase
    .from('srt_users')
    .select('*')
    .eq('telegram_user_id', telegramUserId)
    .single()

  if (!user) {
    await bot.sendMessage(chatId, 'User not found. Please register first.')
    return
  }

  // Find active session
  const today = formatSGTDate(getSGTDate())
  const { data: activeSession } = await supabase
    .from('srt_sessions')
    .select('*')
    .eq('srt_user_id', user.id)
    .eq('date', today)
    .eq('status', 'CLOCKED_IN')
    .single()

  if (!activeSession) {
    await bot.sendMessage(
      chatId,
      '❌ Cannot clock out: You are not currently clocked in.\n\nPlease clock in first.'
    )
    return
  }

  // Update session with clock out
  const clockOutTime = getSGTTimeString()
  const { error } = await supabase
    .from('srt_sessions')
    .update({
      clock_out_time: clockOutTime,
      status: 'CLOCKED_OUT',
    })
    .eq('id', activeSession.id)

  if (error) {
    console.error('Clock out error:', error)
    await bot.sendMessage(chatId, 'Failed to clock out. Please try again.')
    return
  }

  const clockInTime = new Date(activeSession.clock_in_time)
  const clockOut = new Date(clockOutTime)
  const duration = Math.round((clockOut.getTime() - clockInTime.getTime()) / (1000 * 60)) // minutes

  await bot.sendMessage(
    chatId,
    `✅ Successfully clocked out!\n\n` +
    `Clock In: ${clockInTime.toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}\n` +
    `Clock Out: ${clockOut.toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}\n` +
    `Duration: ${duration} minutes\n\n` +
    `Thank you for using SRTrack!`
  )

  // Show updated menu
  await showMainMenu(bot, chatId, telegramUserId, supabase)
}

async function handleStatus(bot: TelegramBot, chatId: number, telegramUserId: number, supabase: any) {
  // Get user
  const { data: user } = await supabase
    .from('srt_users')
    .select('*')
    .eq('telegram_user_id', telegramUserId)
    .single()

  if (!user) {
    await bot.sendMessage(chatId, 'User not found. Please register first.')
    return
  }

  // Get today's session
  const today = formatSGTDate(getSGTDate())
  const { data: todaySession } = await supabase
    .from('srt_sessions')
    .select('*')
    .eq('srt_user_id', user.id)
    .eq('date', today)
    .single()

  if (!todaySession) {
    await bot.sendMessage(
      chatId,
      `📊 Your Status\n\n` +
      `Name: ${user.name}\n` +
      `Rank: ${user.rank}\n` +
      `Company: ${user.company}\n` +
      `Status: NOT CLOCKED IN TODAY`
    )
    return
  }

  const statusEmoji = {
    CLOCKED_IN: '🟢',
    CLOCKED_OUT: '✅',
    RED: '🔴'
  }

  let statusText = `📊 Your Status\n\n` +
    `Name: ${user.name}\n` +
    `Rank: ${user.rank}\n` +
    `Company: ${user.company}\n` +
    `Status: ${statusEmoji[todaySession.status]} ${todaySession.status}\n` +
    `Clock In: ${new Date(todaySession.clock_in_time).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}`

  if (todaySession.clock_out_time) {
    statusText += `\nClock Out: ${new Date(todaySession.clock_out_time).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}`
  }

  if (todaySession.status === 'RED') {
    statusText += `\n\n⚠️ WARNING: You did not clock out before 10:00 PM SGT!`
  }

  await bot.sendMessage(chatId, statusText)
}

