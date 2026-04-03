export interface SignatureConfig {
  showPhone: boolean
  showSocial: boolean
  twitterUrl: string
  linkedinUrl: string
  nameColor: string
  showBanner: boolean
  bannerImageUrl: string
  bannerLinkUrl: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmContent: string
}

export function generateSignatureHtml(c: SignatureConfig): string {
  const phoneRow = c.showPhone
    ? `<span style="color: ${c.nameColor};"><strong>M:&nbsp;</strong></span>{{phone_mobile}}<br>`
    : ''

  const socialCell = c.showSocial
    ? `<td style="width: 54px;">
        <a href="${c.twitterUrl}"><img src="https://cdn.appsrecord.com/social/background-square/default/40/twitter.png" alt="twitter icon" width="20" height="20"></a>
        <a href="${c.linkedinUrl}"><img src="https://cdn.appsrecord.com/social/background-square/default/40/linkedin.png" alt="linkedin icon" width="20" height="20"></a>
       </td>`
    : ''

  const utmParams = new URLSearchParams({
    ...(c.utmSource && { utm_source: c.utmSource }),
    ...(c.utmMedium && { utm_medium: c.utmMedium }),
    ...(c.utmCampaign && { utm_campaign: c.utmCampaign }),
    ...(c.utmContent && { utm_content: c.utmContent }),
  }).toString()

  const bannerHref = c.bannerLinkUrl
    ? `${c.bannerLinkUrl}${utmParams ? '?' + utmParams : ''}`
    : '#'

  const bannerRow = c.showBanner && c.bannerImageUrl
    ? `<br><a href="${bannerHref}" target="_blank" rel="noopener"><img src="${c.bannerImageUrl}" alt="Banner" width="500" height="116" style="display:block;"></a>`
    : ''

  return `<p><span style="font-family: Arial,Helvetica,sans-serif;"><span style="color: ${c.nameColor};"><strong>{{first_name}} {{last_name}}</strong></span></span><br><span style="font-family: Arial,Helvetica,sans-serif;"><em>{{job_title}}</em><br>${phoneRow}<span style="color: ${c.nameColor};"><strong>E: </strong></span>{{email}}</span></p><table style="width: 222px;" border="0" cellspacing="1" cellpadding="1"><tbody><tr><td style="width: 152px;"><a href="https://synup.com/"><img style="float: left;" src="https://cdn.bulksignature.com/images/2671/t27ACHokt9mzaRMNPI45m9JAv1uubp8YuosYMyCh.png" alt="" width="150" height="35"></a></td>${socialCell}</tr></tbody></table>${bannerRow}`
}
