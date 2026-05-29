import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
serve(async () => {
  const key = Deno.env.get("LEMONSQUEEZY_API_KEY")?.trim()!;
  const vid = Deno.env.get("LEMONSQUEEZY_VARIANT_ID")?.trim()!;
  const pid = "1086894";
  const h = { Accept: "application/vnd.api+json", Authorization: `Bearer ${key}` };
  const [v, p, vs] = await Promise.all([
    fetch(`https://api.lemonsqueezy.com/v1/variants/${vid}`, { headers: h }).then(r => r.json()),
    fetch(`https://api.lemonsqueezy.com/v1/products/${pid}`, { headers: h }).then(r => r.json()),
    fetch(`https://api.lemonsqueezy.com/v1/products/${pid}/variants`, { headers: h }).then(r => r.json()),
  ]);
  return new Response(JSON.stringify({
    variant_status: v?.data?.attributes?.status,
    product_status: p?.data?.attributes?.status,
    all_variants: vs?.data?.map((x: any) => ({ id: x.id, status: x.attributes.status, name: x.attributes.name, price: x.attributes.price })),
  }, null, 2), { headers: { "Content-Type": "application/json" } });
});
