import { supabase } from "@/integrations/supabase/client";

/**
 * Extracts the file path from a stored signed URL and generates a fresh signed URL.
 * Falls back to opening the original URL if extraction fails.
 */
export async function getFreshaSignedPdfUrl(pdfUrl: string): Promise<string | null> {
  const pathMatch = pdfUrl.match(/generated-pdfs\/(.+?)(\?|$)/);
  if (!pathMatch) {
    return pdfUrl; // fallback to original
  }
  const filePath = decodeURIComponent(pathMatch[1]);
  const { data, error } = await supabase.storage
    .from('generated-pdfs')
    .createSignedUrl(filePath, 3600); // 1 hour

  if (data?.signedUrl) {
    return data.signedUrl;
  }
  console.error('Failed to generate preview URL:', error);
  return null;
}
