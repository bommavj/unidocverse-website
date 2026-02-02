// functions/api/testimonial-submit.js
// Cloudflare Pages Function — handles testimonial submissions
// Uses Cloudflare D1 (SQLite on edge) — no external database needed

import nodemailer from 'nodemailer';

// ─── Save to Cloudflare D1 ───
async function saveTestimonial(db, { name, email, role, company, quote, rating }) {
  try {
    const result = await db.prepare(`
      INSERT INTO testimonials (name, email, role, company, quote, rating, approved, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))
    `).bind(name, email, role, company || null, quote, rating).run();

    return {
      id: result.meta.last_row_id,
      name,
      email,
      role,
      company,
      quote,
      rating,
      approved: false,
      created_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('D1 INSERT ERROR:', error.message);
    throw error;
  }
}

// ─── Admin notification email ───
function adminNotificationEmail(adminEmail, { id, name, email, role, company, quote, rating }) {
  return {
    from: `UniDocVerse <${adminEmail}>`,
    to: adminEmail,
    subject: `[UniDocVerse] New Testimonial #${id} — ${name} (${rating}⭐)`,
    html: `
<!DOCTYPE html>
<html>
<head>
<style>
  body { background:#0a0c0f; color:#e2e8f0; font-family:'Segoe UI',system-ui,sans-serif; margin:0; padding:40px 16px; }
  .container { max-width:600px; margin:0 auto; }
  .card { background:#111418; border:1px solid #1e2530; border-radius:12px; overflow:hidden; }
  .header { padding:24px 28px; border-bottom:1px solid #1e2530; }
  .badge { background:rgba(240,136,62,0.12); border:1px solid rgba(240,136,62,0.25); color:#f0883e; font-size:0.7rem; padding:4px 10px; border-radius:4px; font-weight:600; display:inline-block; margin-bottom:8px; }
  .header h2 { font-size:1rem; margin:0; color:#e2e8f0; }
  .rating { color:#f0883e; font-size:1.1rem; letter-spacing:2px; margin-bottom:16px; }
  .body { padding:28px; }
  .quote { background:#0a0c0f; border-left:3px solid #3fb950; padding:16px 20px; border-radius:0 8px 8px 0; font-style:italic; color:#8b949e; line-height:1.7; margin-bottom:24px; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px; }
  .info-box { background:#0a0c0f; border:1px solid #1e2530; border-radius:8px; padding:14px; }
  .info-box .label { font-size:0.68rem; color:#484f58; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
  .info-box .value { font-size:0.82rem; color:#e2e8f0; font-weight:500; word-break:break-word; }
  .sql-command { background:#0d1117; border:1px solid #1e2530; border-radius:8px; padding:14px; font-family:monospace; font-size:0.75rem; color:#3fb950; margin:20px 0; overflow-x:auto; }
  .timestamp { font-size:0.68rem; color:#484f58; margin-top:16px; text-align:center; }
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <div class="header">
      <span class="badge">🎉 Testimonial #${id}</span>
      <h2>Pending Your Approval</h2>
    </div>
    <div class="body">
      <div class="rating">${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</div>
      <div class="quote">"${quote}"</div>
      <div class="info-grid">
        <div class="info-box"><div class="label">Name</div><div class="value">${name}</div></div>
        <div class="info-box"><div class="label">Role</div><div class="value">${role}</div></div>
        <div class="info-box"><div class="label">Company</div><div class="value">${company || 'Not specified'}</div></div>
        <div class="info-box"><div class="label">Email</div><div class="value">${email}</div></div>
      </div>
      <div style="background:#161b22;border:1px solid #1e2530;border-radius:8px;padding:16px;margin-bottom:16px;">
        <div style="font-size:0.72rem;color:#8b949e;margin-bottom:8px;">To approve, run in terminal:</div>
        <div class="sql-command">wrangler d1 execute unidocverse-db --command="UPDATE testimonials SET approved=1, approved_at=datetime('now') WHERE id=${id}"</div>
        <div style="font-size:0.7rem;color:#484f58;margin-top:8px;">Or: Cloudflare Dashboard → D1 → unidocverse-db → Query</div>
      </div>
      <div class="timestamp">Submitted: ${new Date().toUTCString()}</div>
    </div>
  </div>
</div>
</body>
</html>`
  };
}

// ─── User thank you email ───
function userThankYouEmail(adminEmail, { name, email }) {
  return {
    from: `UniDocVerse <${adminEmail}>`,
    to: email,
    subject: 'Thank you for your UniDocVerse testimonial!',
    html: `
<!DOCTYPE html>
<html>
<head>
<style>
  body { background:#0a0c0f; color:#e2e8f0; font-family:'Segoe UI',system-ui,sans-serif; margin:0; padding:40px 16px; }
  .container { max-width:520px; margin:0 auto; }
  .card { background:#111418; border:1px solid #1e2530; border-radius:12px; overflow:hidden; }
  .header { background:linear-gradient(135deg,#0d1117,#111418); padding:40px 36px 32px; border-bottom:1px solid #1e2530; }
  .logo { font-size:1.4rem; font-weight:700; color:#e2e8f0; margin-bottom:12px; }
  .logo span { color:#3fb950; }
  .header h2 { font-size:1.1rem; color:#3fb950; font-weight:500; margin:0; }
  .body { padding:32px 36px; }
  .greeting { font-size:0.95rem; color:#8b949e; line-height:1.6; }
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
      <h2>Thank You! 🎉</h2>
    </div>
    <div class="body">
      <p class="greeting">Hi ${name},</p>
      <p class="greeting" style="margin-top:16px;">Thank you for sharing your experience with UniDocVerse. Your feedback helps us improve and helps others discover the platform.</p>
      <p class="greeting" style="margin-top:16px;">We'll review your testimonial shortly. If approved, it will appear on our website soon.</p>
      <p class="greeting" style="margin-top:24px;">We truly appreciate your support!</p>
    </div>
    <div class="footer">
      <p>Questions? Visit <a href="https://unidocverse.com">unidocverse.com</a></p>
    </div>
  </div>
</div>
</body>
</html>`
  };
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
    const { name, email, role, company, quote, rating } = body;

    // ─── Validation ───
    if (!name || !email || !role || !quote) {
      return new Response(
        JSON.stringify({ success: false, error: 'Name, email, role, and testimonial are required.' }),
        { status: 400, headers }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email address.' }),
        { status: 400, headers }
      );
    }

    if (quote.length < 20 || quote.length > 500) {
      return new Response(
        JSON.stringify({ success: false, error: 'Testimonial must be 20-500 characters.' }),
        { status: 400, headers }
      );
    }

    const validRating = rating && rating >= 1 && rating <= 5 ? rating : 5;


    // ─── RATE LIMITING (Prevents spam/abuse) ───
    const clientIP = context.request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = `testimonial:${clientIP}:${email.toLowerCase()}`;

    // Check KV for rate limiting
    if (context.env.RATE_LIMIT_KV) {
      try {
        const lastSubmission = await context.env.RATE_LIMIT_KV.get(rateLimitKey);

        if (lastSubmission) {
          const timeSince = Date.now() - parseInt(lastSubmission);
          const cooldownMinutes = 60; // 1 hour cooldown

          if (timeSince < cooldownMinutes * 60 * 1000) {
            const minutesLeft = Math.ceil((cooldownMinutes * 60 * 1000 - timeSince) / 60000);
            return new Response(
              JSON.stringify({
                success: false,
                error: `Please wait ${minutesLeft} minutes before submitting another testimonial.`
              }),
              { status: 429, headers }
            );
          }
        }

        // Store this submission timestamp
        await context.env.RATE_LIMIT_KV.put(
          rateLimitKey,
          Date.now().toString(),
          { expirationTtl: cooldownMinutes * 60 }
        );
      } catch (kvError) {
        console.log('Rate limit check skipped (KV not available):', kvError.message);
      }
    }


    // ─── Get D1 database ───
    const db = context.env.DB;
    if (!db) {
      console.error('D1 binding not found');
      return new Response(
        JSON.stringify({ success: false, error: 'Database error.' }),
        { status: 500, headers }
      );
    }

    // ─── Save to D1 ───
    const testimonial = await saveTestimonial(db, {
      name,
      email,
      role,
      company,
      quote,
      rating: validRating
    });

    console.log('TESTIMONIAL SAVED TO D1:', testimonial.id);

    // ─── Send emails ───
    const gmailUser = context.env.GMAIL_USER;
    const gmailPass = context.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: gmailUser, pass: gmailPass }
      });

      await Promise.all([
        transporter.sendMail(adminNotificationEmail(gmailUser, testimonial)),
        transporter.sendMail(userThankYouEmail(gmailUser, testimonial))
      ]);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Thank you! Your testimonial has been submitted.' }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('ERROR:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: 'Something went wrong.' }),
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