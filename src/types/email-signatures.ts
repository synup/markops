export type SignatureStatus = 'draft' | 'active'

export interface WorkspaceUser {
  id: string
  google_id: string
  email: string
  first_name: string | null
  last_name: string | null
  job_title: string | null
  department: string | null
  phone_mobile: string | null
  phone_work: string | null
  org_unit: string | null
  is_active: boolean
  signature_override: boolean
  last_synced_at: string
  created_at: string
  active_signature?: Signature | null
}

export interface Signature {
  id: string
  name: string
  html_template: string
  status: SignatureStatus
  is_org_default: boolean
  created_by: string
  created_at: string
  updated_at: string
  user_count?: number
}

export interface SignatureAssignment {
  id: string
  user_id: string
  signature_id: string
  is_override: boolean
  assigned_by: string
  assigned_at: string
}

export interface Campaign {
  id: string
  name: string
  image_url: string
  link_url: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  start_date: string
  end_date: string | null
  signature_id: string | null
  is_active: boolean
  created_at: string
}

export interface DeployLog {
  id: string
  deployed_by: string
  total_users: number
  success_count: number
  failure_count: number
  per_user_results: DeployResult[]
  deployed_at: string
}

export interface DeployResult {
  email: string
  status: 'success' | 'failed'
  error?: string
}
