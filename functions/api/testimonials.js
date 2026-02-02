// functions/api/testimonials.js
// Cloudflare Pages Function — fetches approved testimonials from D1

export async function onRequestGet(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=300' // 5 min cache
  };

  try {
    const db = context.env.DB;

    if (!db) {
      console.error('D1 binding not found');
      return new Response(
        JSON.stringify({ success: false, error: 'Database error.' }),
        { status: 500, headers }
      );
    }

    // Query approved testimonials from D1
    const result = await db.prepare(`
      SELECT id, name, role, company, quote, rating
      FROM testimonials
      WHERE approved = 1
      ORDER BY display_order ASC, created_at DESC
      LIMIT 10
    `).all();

    const testimonials = result.results.map(t => ({
      ...t,
      avatar: t.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }));

    return new Response(
      JSON.stringify({ success: true, testimonials }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('TESTIMONIALS FETCH ERROR:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to load testimonials.' }),
      { status: 500, headers }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}