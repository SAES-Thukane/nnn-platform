// api/supabase.js
// Serverless function — runs on Vercel's edge, never in the browser
// Your Supabase keys live ONLY in Vercel Environment Variables
// Frontend calls /api/supabase?table=xxx — this function proxies to Supabase
// Keys are never exposed in source code or the browser network tab

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { table, params } = req.query;

  // Whitelist — only these tables can be queried by the public frontend
  const ALLOWED_TABLES = [
    'global_settings',
    'intellectual_properties',
    'events_calendar',
    'gallery_archives'
  ];

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Invalid table requested' });
  }

  // These environment variables are set in Vercel dashboard — never in code
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const queryString = params ? decodeURIComponent(params) : '';
    const url = `${SUPABASE_URL}/rest/v1/${table}?${queryString}`;

    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase returned ${response.status}`);
    }

    const data = await response.json();

    // Cache response for 60 seconds on Vercel's CDN
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(data);

  } catch (err) {
    console.error('[NNN API] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
}
