import type { Config } from '@netlify/functions'

const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v)

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const supabaseUrl = Netlify.env.get('SUPABASE_URL')
  const serviceKey = Netlify.env.get('SUPABASE_SERVICE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return Response.json({ error: 'Server not configured' }, { status: 500 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { unit_id, temp_f, humidity_pct, pressure_hpa, water_detected } = body ?? {}
  if (
    typeof unit_id !== 'string' || !unit_id ||
    !num(temp_f) || !num(humidity_pct) || !num(pressure_hpa) ||
    typeof water_detected !== 'boolean'
  ) {
    return Response.json(
      { error: 'Expected unit_id (string), temp_f, humidity_pct, pressure_hpa (numbers), water_detected (boolean)' },
      { status: 400 }
    )
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/readings`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ unit_id, temp_f, humidity_pct, pressure_hpa, water_detected }),
  })

  if (!res.ok) {
    console.error('Supabase insert failed', res.status, await res.text())
    return Response.json({ error: 'Failed to store reading' }, { status: 502 })
  }

  const [row] = await res.json()
  return Response.json(row, { status: 201 })
}

export const config: Config = {
  path: '/api/ingest',
}
