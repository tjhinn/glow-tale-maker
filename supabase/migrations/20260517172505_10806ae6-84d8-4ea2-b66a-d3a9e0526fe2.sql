-- Harden update_generated_page: add caller authorization (admin or service_role)
-- and restrict EXECUTE so authenticated/anon users can no longer call it directly.

CREATE OR REPLACE FUNCTION public.update_generated_page(
  p_order_id uuid,
  p_page_number integer,
  p_image_url text DEFAULT NULL::text,
  p_status text DEFAULT 'pending_review'::text,
  p_generated_at timestamp with time zone DEFAULT now(),
  p_text text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pages JSONB;
  v_page_index INT;
  v_new_page JSONB;
  v_jwt_role TEXT;
BEGIN
  -- Allow service_role (edge functions) or admins; deny everyone else.
  v_jwt_role := current_setting('request.jwt.claims', true)::jsonb->>'role';
  IF v_jwt_role IS DISTINCT FROM 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin or service role required';
  END IF;

  v_new_page := jsonb_build_object(
    'page', p_page_number,
    'image_url', p_image_url,
    'status', p_status,
    'generated_at', p_generated_at,
    'text', p_text
  );

  SELECT generated_pages INTO v_pages FROM orders WHERE id = p_order_id FOR UPDATE;

  SELECT idx - 1 INTO v_page_index
  FROM jsonb_array_elements(COALESCE(v_pages, '[]'::jsonb)) WITH ORDINALITY arr(elem, idx)
  WHERE (elem->>'page')::int = p_page_number;

  IF v_page_index IS NOT NULL THEN
    v_pages := jsonb_set(v_pages, ARRAY[v_page_index::text], v_new_page);
  ELSE
    v_pages := COALESCE(v_pages, '[]'::jsonb) || jsonb_build_array(v_new_page);
  END IF;

  UPDATE orders
  SET
    generated_pages = (
      SELECT jsonb_agg(elem ORDER BY (elem->>'page')::int)
      FROM jsonb_array_elements(v_pages) elem
    ),
    updated_at = NOW()
  WHERE id = p_order_id;
END;
$function$;

-- Restrict EXECUTE on the sensitive RPC. Service role + postgres still has access.
REVOKE EXECUTE ON FUNCTION public.update_generated_page(uuid, integer, text, text, timestamp with time zone, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_generated_page(uuid, integer, text, text, timestamp with time zone, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_generated_page(uuid, integer, text, text, timestamp with time zone, text) FROM authenticated;

-- Also lock down the helper SECURITY DEFINER functions from anonymous callers.
-- has_role and get_current_user_email are still needed by RLS for authenticated users.
REVOKE EXECUTE ON FUNCTION public.get_current_user_email() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;