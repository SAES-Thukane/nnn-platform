// js/config.js
// ─────────────────────────────────────────────────────────────
// NO Supabase keys here. Keys live in Vercel environment variables.
// This file calls our own /api/supabase endpoint (serverless proxy).
// The proxy handles authentication with Supabase server-side.
// ─────────────────────────────────────────────────────────────

async function nnnFetch(table, params = '') {
  const encodedParams = params ? encodeURIComponent(params) : '';
  const url = `/api/supabase?table=${table}${encodedParams ? '&params=' + encodedParams : ''}`;

  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  return res.json();
}
