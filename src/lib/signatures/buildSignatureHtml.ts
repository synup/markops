import { resolveTokens } from './resolveTokens'
import type { WorkspaceUser, Signature, Campaign } from '@/types/email-signatures'

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function safeLinkUrl(url: string | null): string {
  if (!url) return '#'
  return /^https?:\/\//i.test(url) ? url : '#'
}

function buildCampaignBanner(campaign: Campaign): string {
  const utmParams = new URLSearchParams({
    ...(campaign.utm_source && { utm_source: campaign.utm_source }),
    ...(campaign.utm_medium && { utm_medium: campaign.utm_medium }),
    ...(campaign.utm_campaign && { utm_campaign: campaign.utm_campaign }),
    ...(campaign.utm_content && { utm_content: campaign.utm_content }),
  }).toString()

  const baseUrl = safeLinkUrl(campaign.link_url)
  const href = baseUrl !== '#' && utmParams ? `${baseUrl}?${utmParams}` : baseUrl

  return `<br/><a href="${escAttr(href)}" target="_blank" rel="noopener" style="text-decoration:none;">
  <img src="${escAttr(campaign.image_url)}" alt="${escAttr(campaign.name)}" style="max-width:650px;display:block;" />
</a>`
}

export function buildSignatureHtml(
  signature: Signature,
  user: WorkspaceUser,
  activeCampaign?: Campaign | null
): string {
  const resolved = resolveTokens(signature.html_template, user)
  if (!activeCampaign) return resolved
  return resolved + buildCampaignBanner(activeCampaign)
}
