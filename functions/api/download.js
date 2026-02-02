// functions/api/download.js
// Handles two things:
//   POST /api/download        → Track a download + return the download URL
//   GET  /api/download-count  → Return the current download count (for hero stats)

// ─── GET: Fetch download count ───
export async function onRequestGet(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60' // Cache count for 1 minute
  };

  try {
    const db = context.env.DB;

    if (!db) {
      return new Response(
        JSON.stringify({ count: 0 }),
        { status: 200, headers }
      );
    }

    // Get running total from stats table
    const result = await db.prepare(
      'SELECT total_downloads FROM download_stats WHERE id = 1'
    ).first();

    const count = result ? result.total_downloads : 0;

    return new Response(
      JSON.stringify({ count }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('DOWNLOAD COUNT ERROR:', error.message);
    return new Response(
      JSON.stringify({ count: 0 }),
      { status: 200, headers }
    );
  }
}

// ─── POST: Track download + return URL ───
export async function onRequestPost(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const db = context.env.DB;

    // ─── Collect metadata ───
    const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
    const userAgent = context.request.headers.get('User-Agent') || 'unknown';
    const referrer = context.request.headers.get('Referer') || 'direct';
    const country = context.request.headers.get('CF-IPCountry') || 'unknown';

    if (db) {
      // ─── Log the download ───
      await db.prepare(`
        INSERT INTO downloads (ip, user_agent, referrer, country, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).bind(ip, userAgent, referrer, country).run();

      // ─── Increment running total ───
      await db.prepare(`
        UPDATE download_stats
        SET total_downloads = total_downloads + 1,
            last_updated = datetime('now')
        WHERE id = 1
      `).run();

      console.log('DOWNLOAD TRACKED:', JSON.stringify({ ip, country, referrer }));
    }

    // ─── Return the download URL ───
    // Replace this with your actual R2 URL once you upload the DMG
    const downloadUrl = context.env.DMG_URL || 'https://unidocverse.com/UniDocVerse.dmg';

    return new Response(
      JSON.stringify({ success: true, url: downloadUrl }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('DOWNLOAD TRACK ERROR:', error.message);
    // Still return success + URL even if tracking fails
    // Don't block the user from downloading
    const downloadUrl = context.env.DMG_URL || 'https://unidocverse.com/UniDocVerse.dmg';
    return new Response(
      JSON.stringify({ success: true, url: downloadUrl }),
      { status: 200, headers }
    );
  }
}

// ─── CORS preflight ───
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}