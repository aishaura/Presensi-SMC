import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Daily recap cron placeholder. Hubungkan dengan sistem whatsapp/email di sini.'
  })
}
