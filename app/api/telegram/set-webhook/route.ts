import { NextRequest, NextResponse } from 'next/server'
import TelegramBot from 'node-telegram-bot-api'

// This endpoint is for setting up the webhook (run once after deployment)
export async function POST(request: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET

    if (!token || !webhookUrl) {
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_URL must be set' },
        { status: 400 }
      )
    }

    const bot = new TelegramBot(token)
    
    // Set webhook
    const result = await bot.setWebHook(webhookUrl, {
      secret_token: webhookSecret,
    })

    return NextResponse.json({
      success: true,
      result,
      message: 'Webhook set successfully',
    })
  } catch (error: any) {
    console.error('Webhook setup error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to set webhook' },
      { status: 500 }
    )
  }
}

