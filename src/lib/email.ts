import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.RESEND_FROM ?? 'Card Show Central <noreply@cardshowcentral.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApprovalEmailParams {
  to: string
  vendorName: string
  showName: string
  showDate: string | null
  showLocation: string
  showSlug: string
  tierName: string | null
  quantity: number
  tableNumber: string | null
  totalPrice: number
  venmoHandle: string | null
}

export interface RejectionEmailParams {
  to: string
  vendorName: string
  showName: string
  showSlug: string
}

export interface ConfirmationEmailParams {
  to: string
  vendorName: string
  showName: string
  showDate: string | null
  showLocation: string
  showSlug: string
  tierName: string | null
  quantity: number
  tableNumber: string | null
}

export interface ApplicationReceivedEmailParams {
  to: string
  vendorName: string
  showName: string
  showDate: string | null
  showLocation: string
  showSlug: string
  tierName: string | null
  requestedQuantity: number
}

export interface InviteEmailParams {
  to: string
  vendorName: string
  showName: string
  showDate: string | null
  showLocation: string
  showSlug: string
  hostName: string
  inviteToken: string
}

export interface BlastRecipient {
  to: string
  vendorName: string
}

export interface BlastParams {
  showName: string
  showSlug: string
  subject: string
  message: string
  hostName: string
  hostEmail: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function emailDateRow(date: string | null) {
  return date
    ? `<tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Date</td><td style="color:#111827;font-weight:600;font-size:13px;text-align:right;">${fmtDate(date)}</td></tr>`
    : ''
}

function emailTierRow(tierName: string | null, label = 'Table Tier') {
  return tierName
    ? `<tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">${label}</td><td style="color:#111827;font-weight:600;font-size:13px;text-align:right;">${tierName}</td></tr>`
    : ''
}

function emailTableRow(tableNumber: string | null) {
  return tableNumber
    ? `<tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Table #</td><td style="color:#111827;font-weight:600;font-size:13px;text-align:right;">${tableNumber}</td></tr>`
    : ''
}

// ─── Templates ───────────────────────────────────────────────────────────────

function approvalHtml(p: ApprovalEmailParams): string {
  const showUrl = `${APP_URL}/shows/${p.showSlug}`
  const dateRow  = emailDateRow(p.showDate)
  const tierRow  = emailTierRow(p.tierName)
  const tableRow = emailTableRow(p.tableNumber)
  const priceRow = p.totalPrice > 0
    ? `<tr><td colspan="2" style="padding:8px 0 0;"><div style="height:1px;background:#e5e7eb;"></div></td></tr>
       <tr><td style="color:#6b7280;padding:8px 0 0;font-size:13px;">Amount Due</td><td style="color:#16a34a;font-weight:800;font-size:16px;text-align:right;padding-top:8px;">$${p.totalPrice.toLocaleString()}</td></tr>`
    : ''

  const venmo = p.venmoHandle ? p.venmoHandle.replace(/^@/, '') : null
  const paymentSection = p.totalPrice > 0
    ? venmo
      ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin-bottom:24px;">
           <p style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;">Payment Instructions</p>
           <p style="color:#374151;font-size:14px;margin:0 0 16px;">To secure your spot, please send payment via Venmo:</p>
           <div style="background:white;border:1px solid #dcfce7;border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:14px;">
             <span style="font-size:28px;line-height:1;">💸</span>
             <div>
               <p style="font-size:20px;font-weight:900;color:#111827;margin:0;letter-spacing:-0.5px;">@${venmo}</p>
               <p style="font-size:13px;color:#16a34a;font-weight:700;margin:4px 0 0;">Amount: $${p.totalPrice.toLocaleString()}</p>
             </div>
           </div>
           <p style="font-size:12px;color:#6b7280;margin:12px 0 0;">In the Venmo note, include your name and &quot;${p.showName}&quot;</p>
         </div>`
      : `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
           <p style="color:#374151;font-size:14px;margin:0;">The show host will reach out with payment details.</p>
         </div>`
    : ''

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>You're Approved!</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#f3f4f6;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:28px;">
    <span style="font-size:11px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#9ca3af;">CARD SHOW CENTRAL</span>
  </div>
  <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:36px 40px;">
      <div style="font-size:40px;margin-bottom:14px;">🎉</div>
      <h1 style="color:white;font-size:26px;font-weight:900;margin:0 0 8px;letter-spacing:-0.5px;">You're Approved!</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;">Your vendor spot at <strong style="color:white;">${p.showName}</strong> is reserved.</p>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hi ${p.vendorName},</p>
      <p style="color:#374151;font-size:15px;margin:0 0 28px;">Great news — your vendor application has been approved. Here are your details:</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px;">Your Assignment</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Location</td><td style="color:#111827;font-weight:600;font-size:13px;text-align:right;">${p.showLocation}</td></tr>
          ${dateRow}
          <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Tables</td><td style="color:#111827;font-weight:600;font-size:13px;text-align:right;">${p.quantity}</td></tr>
          ${tierRow}
          ${tableRow}
          ${priceRow}
        </table>
      </div>
      ${paymentSection}
      <p style="color:#6b7280;font-size:13px;margin:0 0 28px;">Questions? Contact the show host or visit the show page for more info.</p>
      <div style="text-align:center;">
        <a href="${showUrl}" style="display:inline-block;background:#16a34a;color:white;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;">View Show Page →</a>
      </div>
    </div>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">Card Show Central &middot; You're receiving this because you applied as a vendor</p>
</div>
</body></html>`
}

function rejectionHtml(p: RejectionEmailParams): string {
  const showUrl = `${APP_URL}/shows/${p.showSlug}`
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Application Update</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#f3f4f6;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:28px;">
    <span style="font-size:11px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#9ca3af;">CARD SHOW CENTRAL</span>
  </div>
  <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#f9fafb;border-bottom:1px solid #e5e7eb;padding:32px 40px;">
      <h1 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 6px;">Application Update</h1>
      <p style="color:#6b7280;font-size:14px;margin:0;">${p.showName}</p>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#374151;font-size:15px;margin:0 0 16px;">Hi ${p.vendorName},</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px;">Thank you for applying to be a vendor at <strong>${p.showName}</strong>.</p>
      <p style="color:#374151;font-size:15px;margin:0 0 28px;">After reviewing all applications, we're not able to accommodate you at this time. We appreciate your interest and hope you'll apply again for future events.</p>
      <div style="text-align:center;">
        <a href="${showUrl}" style="display:inline-block;background:#f3f4f6;color:#374151;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;border:1px solid #e5e7eb;">View Show Page</a>
      </div>
    </div>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">Card Show Central &middot; You're receiving this because you applied as a vendor</p>
</div>
</body></html>`
}

function confirmationHtml(p: ConfirmationEmailParams): string {
  const showUrl  = `${APP_URL}/shows/${p.showSlug}`
  const dateRow  = emailDateRow(p.showDate)
  const tierRow  = emailTierRow(p.tierName)
  const tableRow = emailTableRow(p.tableNumber)
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>You're All Set!</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#f3f4f6;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:28px;">
    <span style="font-size:11px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#9ca3af;">CARD SHOW CENTRAL</span>
  </div>
  <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);padding:36px 40px;">
      <div style="font-size:40px;margin-bottom:14px;">✅</div>
      <h1 style="color:white;font-size:26px;font-weight:900;margin:0 0 8px;">You're All Set!</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;">Payment received — your spot at <strong style="color:white;">${p.showName}</strong> is confirmed.</p>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hi ${p.vendorName},</p>
      <p style="color:#374151;font-size:15px;margin:0 0 28px;">Your payment has been received and your vendor spot is fully confirmed. We'll be in touch as the show approaches. See you there!</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:28px;">
        <p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px;">Your Confirmed Spot</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Location</td><td style="color:#111827;font-weight:600;font-size:13px;text-align:right;">${p.showLocation}</td></tr>
          ${dateRow}
          <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Tables</td><td style="color:#111827;font-weight:600;font-size:13px;text-align:right;">${p.quantity}</td></tr>
          ${tierRow}
          ${tableRow}
        </table>
      </div>
      <div style="text-align:center;">
        <a href="${showUrl}" style="display:inline-block;background:#7c3aed;color:white;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;">View Show Page →</a>
      </div>
    </div>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">Card Show Central &middot; You're receiving this because you applied as a vendor</p>
</div>
</body></html>`
}

function blastHtml(vendorName: string, messageHtml: string, showUrl: string, p: BlastParams): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${p.subject}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#f3f4f6;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:28px;">
    <span style="font-size:11px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#9ca3af;">CARD SHOW CENTRAL</span>
  </div>
  <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1e293b;padding:24px 40px;">
      <p style="color:rgba(255,255,255,0.45);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 4px;">Message from ${p.hostName}</p>
      <h1 style="color:white;font-size:20px;font-weight:800;margin:0;letter-spacing:-0.3px;">${p.showName}</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#374151;font-size:15px;margin:0 0 20px;">Hi ${vendorName},</p>
      <div style="color:#374151;font-size:15px;line-height:1.75;margin:0 0 36px;">${messageHtml}</div>
      <div style="border-top:1px solid #e5e7eb;padding-top:24px;text-align:center;">
        <a href="${showUrl}" style="display:inline-block;background:#1e293b;color:white;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;">View Show Page</a>
      </div>
    </div>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">Card Show Central &middot; Sent by ${p.hostName} for ${p.showName}</p>
</div>
</body></html>`
}

function applicationReceivedHtml(p: ApplicationReceivedEmailParams): string {
  const showUrl = `${APP_URL}/shows/${p.showSlug}`
  const dateRow = emailDateRow(p.showDate)
  const tierRow = emailTierRow(p.tierName, 'Requested Tier')
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Application Received</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#f3f4f6;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:28px;">
    <span style="font-size:11px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#9ca3af;">CARD SHOW CENTRAL</span>
  </div>
  <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);padding:36px 40px;">
      <div style="font-size:40px;margin-bottom:14px;">📬</div>
      <h1 style="color:white;font-size:26px;font-weight:900;margin:0 0 8px;letter-spacing:-0.5px;">Application Received!</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;">We&apos;ve got your application for <strong style="color:white;">${p.showName}</strong>.</p>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hi ${p.vendorName},</p>
      <p style="color:#374151;font-size:15px;margin:0 0 28px;">Your vendor application has been submitted. The organizer will review it and reach out with a decision. Here&apos;s a summary of what you requested:</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:28px;">
        <p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px;">Your Request</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Show</td><td style="color:#111827;font-weight:600;font-size:13px;text-align:right;">${p.showName}</td></tr>
          <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Location</td><td style="color:#111827;font-weight:600;font-size:13px;text-align:right;">${p.showLocation}</td></tr>
          ${dateRow}
          <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Tables Requested</td><td style="color:#111827;font-weight:600;font-size:13px;text-align:right;">${p.requestedQuantity}</td></tr>
          ${tierRow}
        </table>
      </div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
        <p style="color:#1e40af;font-size:14px;margin:0;"><strong>What happens next?</strong> The show organizer will review your application and send you an email once a decision has been made. Keep an eye on your inbox!</p>
      </div>
      <div style="text-align:center;">
        <a href="${showUrl}" style="display:inline-block;background:#2563eb;color:white;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;">View Show Page →</a>
      </div>
    </div>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">Card Show Central &middot; You&apos;re receiving this because you applied as a vendor</p>
</div>
</body></html>`
}

function inviteHtml(p: InviteEmailParams): string {
  const acceptUrl = `${APP_URL}/shows/${p.showSlug}/apply?token=${p.inviteToken}`
  const showUrl   = `${APP_URL}/shows/${p.showSlug}`
  const dateRow   = emailDateRow(p.showDate)
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>You've been invited!</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#f3f4f6;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:28px;">
    <span style="font-size:11px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#9ca3af;">CARD SHOW CENTRAL</span>
  </div>
  <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#d97706 0%,#b45309 100%);padding:36px 40px;">
      <div style="font-size:40px;margin-bottom:14px;">🌟</div>
      <h1 style="color:white;font-size:26px;font-weight:900;margin:0 0 8px;letter-spacing:-0.5px;">You&apos;re Invited!</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;"><strong style="color:white;">${p.hostName}</strong> has personally invited you to vendor at <strong style="color:white;">${p.showName}</strong>.</p>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hi ${p.vendorName},</p>
      <p style="color:#374151;font-size:15px;margin:0 0 28px;">Great news — you&apos;ve received a personal invitation to vendor at <strong>${p.showName}</strong>. Click below to accept and complete your application.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:28px;">
        <p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px;">Show Details</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Location</td><td style="color:#111827;font-weight:600;font-size:13px;text-align:right;">${p.showLocation}</td></tr>
          ${dateRow}
          <tr><td style="color:#6b7280;padding:5px 0;font-size:13px;">Invited by</td><td style="color:#111827;font-weight:600;font-size:13px;text-align:right;">${p.hostName}</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin-bottom:16px;">
        <a href="${acceptUrl}" style="display:inline-block;background:#d97706;color:white;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;">Accept Invitation →</a>
      </div>
      <div style="text-align:center;">
        <a href="${showUrl}" style="color:#6b7280;font-size:13px;text-decoration:none;">View show page instead</a>
      </div>
    </div>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">Card Show Central &middot; You&apos;re receiving this because ${p.hostName} invited you to vendor</p>
</div>
</body></html>`
}

// ─── Send functions ───────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string, logTag: string) {
  if (!resend) { console.log(`[EMAIL] ${logTag} →`, to); return }
  await resend.emails.send({ from: FROM, to, subject, html })
}

export async function sendApplicationReceivedEmail(params: ApplicationReceivedEmailParams) {
  await sendEmail(
    params.to,
    `Application received for ${params.showName}`,
    applicationReceivedHtml(params),
    `ApplicationReceived | ${params.showName}`,
  )
}

export async function sendInviteEmail(params: InviteEmailParams) {
  await sendEmail(
    params.to,
    `You've been invited to vendor at ${params.showName}! 🌟`,
    inviteHtml(params),
    `Invite | ${params.showName}`,
  )
}

export async function sendApprovalEmail(params: ApprovalEmailParams) {
  await sendEmail(
    params.to,
    `You're approved for ${params.showName}! 🎉`,
    approvalHtml(params),
    `Approval | ${params.showName} | $${params.totalPrice}`,
  )
}

export async function sendRejectionEmail(params: RejectionEmailParams) {
  await sendEmail(
    params.to,
    `Your application for ${params.showName}`,
    rejectionHtml(params),
    `Rejection | ${params.showName}`,
  )
}

export async function sendConfirmationEmail(params: ConfirmationEmailParams) {
  await sendEmail(
    params.to,
    `Payment confirmed — you're all set for ${params.showName}! ✅`,
    confirmationHtml(params),
    `Confirmation | ${params.showName}`,
  )
}

export async function sendBlastEmails(recipients: BlastRecipient[], params: BlastParams): Promise<number> {
  if (!resend) {
    console.log(`[EMAIL] Blast (${recipients.length} recipients) →`, params.subject)
    return recipients.length
  }
  // Pre-compute shared values once instead of per recipient
  const showUrl = `${APP_URL}/shows/${params.showSlug}`
  const messageHtml = params.message
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')

  // batch API requires a verified sending domain
  const CHUNK = 100
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const chunk = recipients.slice(i, i + CHUNK)
    await resend.batch.send(
      chunk.map((r) => ({
        from: FROM,
        to: r.to,
        replyTo: params.hostEmail,
        subject: params.subject,
        html: blastHtml(r.vendorName, messageHtml, showUrl, params),
      }))
    )
  }
  return recipients.length
}
