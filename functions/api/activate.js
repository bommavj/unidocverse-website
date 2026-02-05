// functions/api/activate.js
// Tiny activation server using Cloudflare D1
// Same style as license-request.js

export async function onRequestPost(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const db = context.env.DB; // D1 binding
    const body = await context.request.json();
    const { license_key, device_id, expiry } = body;

    if (!license_key || !device_id || !expiry) {
      return new Response(
        JSON.stringify({ allowed: false, error: 'Missing fields.' }),
        { status: 400, headers }
      );
    }

    // Check if license already activated
    const existing = await db
      .prepare("SELECT device_id, expiry_at FROM activations WHERE license_key = ?")
      .bind(license_key)
      .first();

    // ─── First activation ───
    if (!existing) {
      await db
        .prepare("INSERT INTO activations (license_key, device_id, activated_at, expiry_at) VALUES (?, ?, datetime('now'), ?)")
        .bind(license_key, device_id, expiry)
        .run();

      return new Response(
        JSON.stringify({
          allowed: true,
          first_activation: true,
          expiry_at: expiry
        }),
        { status: 200, headers }
      );
    }

    // ─── Already activated ───
    if (existing.device_id !== device_id) {
      return new Response(
        JSON.stringify({ allowed: false, error: 'License already activated on another device.' }),
        { status: 403, headers }
      );
    }

    // ─── Check expiry ───
    const now = new Date();
    const expiryDate = new Date(existing.expiry_at);

    if (now > expiryDate) {
      return new Response(
        JSON.stringify({ allowed: false, error: 'License expired.' }),
        { status: 403, headers }
      );
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        first_activation: false,
        expiry_at: existing.expiry_at
      }),
      { status: 200, headers }
    );

  } catch (err) {
    console.error("ACTIVATION ERROR:", err);
    return new Response(
      JSON.stringify({ allowed: false, error: 'Server error.' }),
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
