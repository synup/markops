import type { WorkspaceUser } from '@/types/email-signatures'

const TOKEN_MAP: Record<string, (u: WorkspaceUser) => string> = {
  first_name: u => u.first_name ?? '',
  last_name: u => u.last_name ?? '',
  full_name: u => [u.first_name, u.last_name].filter(Boolean).join(' '),
  job_title: u => u.job_title ?? '',
  department: u => u.department ?? '',
  email: u => u.email,
  phone_mobile: u => u.phone_mobile ?? '',
  phone_work: u => u.phone_work ?? '',
}

export function resolveTokens(template: string, user: WorkspaceUser): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, token) => {
    const resolver = TOKEN_MAP[token]
    return resolver ? resolver(user) : match
  })
}
