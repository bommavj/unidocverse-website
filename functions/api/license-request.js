// functions/api/license-request.js
// Handles license request form submissions
// Uses Resend via fetch() — no npm, no nodemailer

import { sendEmail } from './_email.js';

// ─── Confirmation email HTML to the user ───
function userConfirmationHTML(name, org, useCase) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body { background:#0a0c0f; color:#e2e8f0; font-family:'Segoe UI',system-ui,sans-serif; margin:0; padding:40px 16px; }
  .container { max-width:560px; margin:0 auto; }
  .card { background:#111418; border:1px solid #1e2530; border-radius:12px; overflow:hidden; }
  .header { background:linear-gradient(135deg,#0d1117,#111418); padding:40px 36px 32px; border-bottom:1px solid #1e2530; }
  .logo { font-size:1.4rem; font-weight:700; color:#e2e8f0; margin-bottom:12px; }
  .logo span { color:#3fb950; }
  .header h2 { font-size:1.1rem; color:#3fb950; font-weight:500; margin:0; }
  .body { padding:32px 36px; }
  .greeting { font-size:0.95rem; color:#8b949e; margin-bottom:24px; line-height:1.6; }
  .detail-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #1e2530; }
  .detail-row:last-child { border-bottom:none; }
  .detail-label { font-size:0.78rem; color:#484f58; text-transform:uppercase; letter-spacing:1px; }
  .detail-value { font-size:0.82rem; color:#e2e8f0; font-weight:500; }
  .timeline { margin:28px 0; }
  .timeline-item { display:flex; gap:14px; margin-bottom:18px; }
  .timeline-dot { width:24px; height:24px; border-radius:50%; background:#1e2530; border:2px solid #3fb950; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .timeline-dot.done { background:#3fb950; border-color:#3fb950; }
  .timeline-dot svg { width:12px; height:12px; }
  .timeline-text { font-size:0.82rem; color:#8b949e; padding-top:3px; }
  .timeline-text strong { color:#e2e8f0; display:block; margin-bottom:2px; }
  .footer { padding:24px 36px; border-top:1px solid #1e2530; text-align:center; }
  .footer p { font-size:0.72rem; color:#484f58; margin:0; }
  .footer a { color:#3fb950; text-decoration:none; }
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <div class="header">
      <div class="logo">Uni<span>Doc</span>Verse</div>
      <h2>License Request Received ✓</h2>
    </div>
    <div class="body">
      <p class="greeting">Hi ${name},<br>Thank you for your interest in UniDocVerse. We've received your license request and will process it shortly.</p>
      <div>
        <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${name}</span></div>
        <div class="detail-row"><span class="detail-label">Organization</span><span class="detail-value">${org}</span></div>
        <div class="detail-row"><span class="detail-label">Use Case</span><span class="detail-value">${useCase.charAt(0).toUpperCase() + useCase.slice(1)}</span></div>
        <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value" style="color:#3fb950;">Under Review</span></div>
      </div>
      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-dot done"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="timeline-text"><strong>Request Submitted</strong>We've received your information</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"><svg viewBox="0 0 24 24" fill="none" stroke="#3fb950" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="timeline-text"><strong>Under Review</strong>Typically within 24 hours</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"><svg viewBox="0 0 24 24" fill="none" stroke="#3fb950" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
          <div class="timeline-text"><strong>License Delivered</strong>RSA-signed key sent to your email</div>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>Questions? Reply to this email or visit <a href="https://unidocverse.com">unidocverse.com</a></p>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─── Admin notification email HTML ───
function adminNotificationHTML(name, email, org, useCase) {
  return `
<!DOCTYPE html>
<html>
<head>
<style>
  body { background:#0a0c0f; color:#e2e8f0; font-family:'Segoe UI',system-ui,sans-serif; margin:0; padding:40px 16px; }
  .container { max-width:520px; margin:0 auto; }
  .card { background:#111418; border:1px solid #1e2530; border-radius:12px; overflow:hidden; }
  .header { padding:24px 28px; border-bottom:1px solid #1e2530; }
  .badge { background:rgba(63,185,80,0.12); border:1px solid rgba(63,185,80,0.25); color:#3fb950; font-size:0.7rem; padding:4px 10px; border-radius:4px; font-weight:600; display:inline-block; margin-bottom:8px; }
  .header h2 { font-size:1rem; margin:0; color:#e2e8f0; }
  .body { padding:28px; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .info-box { background:#0a0c0f; border:1px solid #1e2530; border-radius:8px; padding:14px; }
  .info-box .label { font-size:0.68rem; color:#484f58; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
  .info-box .value { font-size:0.82rem; color:#e2e8f0; font-weight:500; word-break:break-word; }
  .actions { margin-top:24px; padding-top:20px; border-top:1px solid #1e2530; display:flex; gap:10px; }
  .btn { display:inline-block; padding:9px 18px; border-radius:6px; font-size:0.78rem; font-weight:600; text-decoration:none; }
  .btn-green { background:#3fb950; color:#0a0c0f; }
  .btn-outline { background:transparent; color:#8b949e; border:1px solid #2a3340; }
  .timestamp { font-size:0.68rem; color:#484f58; margin-top:16px; }
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <div class="header">
      <span class="badge">🔔 New Request</span>
      <h2>License Request</h2>
    </div>
    <div class="body">
      <div class="info-grid">
        <div class="info-box"><div class="label">Name</div><div class="value">${name}</div></div>
        <div class="info-box"><div class="label">Email</div><div class="value" style="font-size:0.75rem;">${email}</div></div>
        <div class="info-box"><div class="label">Organization</div><div class="value">${org}</div></div>
        <div class="info-box"><div class="label">Use Case</div><div class="value">${useCase.charAt(0).toUpperCase() + useCase.slice(1)}</div></div>
      </div>
      <div class="actions">
        <a href="mailto:${email}?subject=Your UniDocVerse License&body=Hi ${name}," class="btn btn-green">Reply to User</a>
        <span class="btn btn-outline">Generate License</span>
      </div>
      <div class="timestamp">Submitted: ${new Date().toUTCString()}</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─── Main handler ───
export async function onRequestPost(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const body = await context.request.json();
    const { name, email, organization, useCase } = body;

    // ─── Validation ───
    if (!name || !email || !organization || !useCase) {
      return new Response(
        JSON.stringify({ success: false, error: 'All fields are required.' }),
        { status: 400, headers }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email address.' }),
        { status: 400, headers }
      );
    }

    const adminEmail = context.env.GMAIL_USER || 'unidocverse@gmail.com';

    // ─── Send both emails in parallel via Resend ───
    const [userResult, adminResult] = await Promise.all([
      sendEmail(context.env, {
        to: email,
        subject: 'Your UniDocVerse License Request — Received ✓',
        html: userConfirmationHTML(name, organization, useCase)
      }),
      sendEmail(context.env, {
        to: adminEmail,
        subject: `[UniDocVerse] New License Request — ${name} (${organization})`,
        html: adminNotificationHTML(name, email, organization, useCase)
      })
    ]);

    console.log('LICENSE REQUEST SENT:', JSON.stringify({
      name, email, organization, useCase,
      userEmailId: userResult.id,
      adminEmailId: adminResult.id
    }));

    return new Response(
      JSON.stringify({ success: true, message: 'License request submitted. Check your email.' }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('LICENSE REQUEST ERROR:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: 'Something went wrong. Please try again.' }),
      { status: 500, headers }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}