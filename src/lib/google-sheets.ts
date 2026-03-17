import { google } from 'googleapis'
import type { PseoArticle } from '@/types'

let cache: { data: PseoArticle[]; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getAuthClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}')
  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

const HEADER_MAP: Record<string, keyof PseoArticle> = {
  'site': 'site',
  'content type': 'contentType',
  'title': 'title',
  'slug': 'slug',
  'full url': 'fullUrl',
  'target keyword': 'targetKeyword',
  'category': 'category',
  'tool count': 'toolCount',
  'tools list': 'toolsList',
  'published date': 'publishedDate',
  'indexer status': 'indexerStatus',
  'indexer response code': 'indexerResponseCode',
  'timestamp': 'timestamp',
}

function mapRowToArticle(row: string[], headerIndices: Map<keyof PseoArticle, number>): PseoArticle {
  const get = (field: keyof PseoArticle) => row[headerIndices.get(field) ?? -1] ?? ''
  return {
    site: get('site'),
    contentType: get('contentType'),
    title: get('title'),
    slug: get('slug'),
    fullUrl: get('fullUrl'),
    targetKeyword: get('targetKeyword'),
    category: get('category'),
    toolCount: parseInt(get('toolCount'), 10) || 0,
    toolsList: get('toolsList'),
    publishedDate: get('publishedDate'),
    indexerStatus: get('indexerStatus'),
    indexerResponseCode: parseInt(get('indexerResponseCode'), 10) || 0,
    timestamp: get('timestamp'),
  }
}

export async function fetchPseoData(): Promise<PseoArticle[]> {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data
  }

  const auth = getAuthClient()
  const sheets = google.sheets({ version: 'v4', auth })
  const sheetId = process.env.GOOGLE_SHEET_ID

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'Dashboard',
  })

  const rows = response.data.values || []
  if (rows.length === 0) return []

  const headers = rows[0].map((h: string) => h.trim().toLowerCase())
  const headerIndices = new Map<keyof PseoArticle, number>()
  headers.forEach((h: string, i: number) => {
    const mapped = HEADER_MAP[h]
    if (mapped) headerIndices.set(mapped, i)
  })

  const data = rows.slice(1)
    .filter(row => row.some((cell: string) => cell?.trim()))
    .map(row => mapRowToArticle(row, headerIndices))

  cache = { data, timestamp: Date.now() }
  return data
}
