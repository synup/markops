import { google } from 'googleapis'

function getServiceAccount() {
  const raw = process.env.GOOGLE_ES_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_ES_SERVICE_ACCOUNT_JSON is not set')
  try {
    const sa = JSON.parse(raw)
    // Fix private key newlines — Vercel may store \n as literal \\n
    if (sa.private_key) {
      sa.private_key = sa.private_key.replace(/\\n/g, '\n')
    }
    return sa
  } catch {
    throw new Error('GOOGLE_ES_SERVICE_ACCOUNT_JSON is not valid JSON')
  }
}

export function getAdminAuth() {
  const sa = getServiceAccount()
  return new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly'],
    subject: process.env.GOOGLE_ADMIN_EMAIL,
  })
}

export function getUserAuth(userEmail: string) {
  const sa = getServiceAccount()
  return new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/gmail.settings.basic'],
    subject: userEmail,
  })
}

export function isServiceAccountConfigured(): boolean {
  return !!process.env.GOOGLE_ES_SERVICE_ACCOUNT_JSON && !!process.env.GOOGLE_ADMIN_EMAIL
}
