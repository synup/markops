import { NextResponse } from 'next/server'
import { fetchPseoData } from '@/lib/google-sheets'

export async function GET() {
  try {
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      return NextResponse.json(
        { error: 'Google Sheets configuration missing. Set GOOGLE_SHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON environment variables.' },
        { status: 500 }
      )
    }

    const articles = await fetchPseoData()
    return NextResponse.json({ articles })
  } catch (error) {
    console.error('Failed to fetch pSEO data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data from Google Sheets' },
      { status: 500 }
    )
  }
}
