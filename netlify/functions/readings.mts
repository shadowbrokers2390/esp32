import type { Config } from '@netlify/functions'

export default async (req: Request) => {
  const supabaseUrl = Netlify.env.get('SUPABASE_URL')
  const serviceKey = Netlify.env.get('SUPABASE_SERVICE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return Response.json({ error: 'Server not configured' }, { status: 500 })
  }

  const params = new URL(req.url).searchParams
  const unitId = params.get('unit_id')
  if (!unitId) {
    return Response.json({ error: 'unit_id is required' }, { status: 400 })
  }
  const limit = Math.min(Math.max(parseInt(params.get('limit') ?? '24', 10) || 24, 1), 500)

  const query = new URLSearchParams({
    select: '*',
    unit_id: `eq.${unitId}`,
    order: 'created_at.desc',
    limit: String(limit),
  })
  const res = await fetch(`${supabaseUrl}/rest/v1/readings?${query}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  })

  if (!res.ok) {
    console.error('Supabase query failed', res.status, await res.text())
    return Response.json({ error: 'Failed to load readings' }, { status: 502 })
  }

  return Response.json(await res.json(), { headers: { 'Cache-Control': 'no-store' } })
}

export const config: Config = {
  path: '/api/readings',
}
