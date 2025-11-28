-- Create atomic function for updating individual pages in generated_pages array
-- This prevents race conditions when multiple operations happen concurrently
CREATE OR REPLACE FUNCTION public.update_generated_page(
  p_order_id UUID,
  p_page_number INT,
  p_image_url TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'pending_review',
  p_generated_at TIMESTAMPTZ DEFAULT NOW(),
  p_text TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_pages JSONB;
  v_page_index INT;
  v_new_page JSONB;
BEGIN
  -- Build the new page object
  v_new_page := jsonb_build_object(
    'page', p_page_number,
    'image_url', p_image_url,
    'status', p_status,
    'generated_at', p_generated_at,
    'text', p_text
  );

  -- Get current pages with row lock to prevent concurrent modifications
  SELECT generated_pages INTO v_pages FROM orders WHERE id = p_order_id FOR UPDATE;
  
  -- Find if page exists in array
  SELECT idx - 1 INTO v_page_index
  FROM jsonb_array_elements(COALESCE(v_pages, '[]'::jsonb)) WITH ORDINALITY arr(elem, idx)
  WHERE (elem->>'page')::int = p_page_number;

  -- Update existing page or insert new one
  IF v_page_index IS NOT NULL THEN
    -- Update existing page at specific index
    v_pages := jsonb_set(v_pages, ARRAY[v_page_index::text], v_new_page);
  ELSE
    -- Append new page to array
    v_pages := COALESCE(v_pages, '[]'::jsonb) || jsonb_build_array(v_new_page);
  END IF;

  -- Sort by page number and update the order
  UPDATE orders 
  SET 
    generated_pages = (
      SELECT jsonb_agg(elem ORDER BY (elem->>'page')::int)
      FROM jsonb_array_elements(v_pages) elem
    ),
    updated_at = NOW()
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;