import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId } = await req.json()
    if (!orderId || typeof orderId !== 'string') {
      return new Response(JSON.stringify({ error: 'orderId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: order, error } = await supabase
      .from('orders')
      .select('personalization_data, story_id, personalized_cover_url')
      .eq('id', orderId)
      .maybeSingle()

    if (error || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const pd = (order.personalization_data as any) || {}

    let story: { id: string; title: string; moral: string } | null = null
    if (order.story_id) {
      const { data: s } = await supabase
        .from('stories')
        .select('id, title, moral')
        .eq('id', order.story_id)
        .maybeSingle()
      if (s) story = s as any
    }

    return new Response(
      JSON.stringify({
        personalizedCoverUrl: order.personalized_cover_url || pd.personalizedCoverUrl || null,
        heroName: pd.heroName || null,
        story,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})