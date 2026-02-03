// functions/api/_email.js
// Shared email helper — uses Resend HTTP API
// Native fetch() only. Zero npm. Works on Cloudflare edge.

export async function sendEmail(env, { to, subject, html }) {
  const apiKey = env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('RESEND_API_KEY not set in env vars');
    throw new Error('Email not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'UniDocVerse <onboarding@resend.dev>',
      to: [to],
      subject,
      html
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Resend error:', JSON.stringify(data));
    throw new Error(data.message || 'Email send failed');
  }

  return data;
}