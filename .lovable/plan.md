

## Plan: Fix Expired PDF Preview URLs

### Problem
The "Preview PDF" link stores a **7-day signed URL** in the database. Since it's been about a week, this URL has expired, causing the `InvalidJWT` / `"exp" claim timestamp check failed` error when clicking "Preview PDF."

### Root Cause
In `compile-storybook-pdf/index.ts`, the signed URL (valid for 7 days) is saved to `orders.pdf_url`. After expiration, the link is dead.

### Solution
Replace the direct `<a href={pdf_url}>` link with a button that generates a **fresh signed URL on-demand** each time the admin clicks "Preview PDF."

---

### File 1: `src/pages/admin/OrderCard.tsx`

**Replace** the static "Preview PDF" link (around line 176-183) with a button that calls a helper function to create a fresh signed URL from Supabase Storage.

The button will:
1. Extract the file path from the stored `pdf_url` (or store just the file path in a separate column)
2. Call `supabase.storage.from('generated-pdfs').createSignedUrl(filePath, 3600)` to get a fresh 1-hour URL
3. Open the URL in a new tab

```tsx
// New "Preview PDF" button with on-demand signed URL
const handlePreviewPdf = async (pdfUrl: string) => {
  // Extract file path from the stored signed URL
  const pathMatch = pdfUrl.match(/generated-pdfs\/(.+?)\?/);
  if (!pathMatch) {
    window.open(pdfUrl, '_blank'); // fallback
    return;
  }
  const filePath = decodeURIComponent(pathMatch[1]);
  const { data, error } = await supabase.storage
    .from('generated-pdfs')
    .createSignedUrl(filePath, 3600); // 1 hour
  if (data?.signedUrl) {
    window.open(data.signedUrl, '_blank');
  } else {
    // Show error toast or fallback
    console.error('Failed to generate preview URL:', error);
  }
};
```

Replace the static `<a>` tag with:
```tsx
<button
  onClick={() => handlePreviewPdf(order.pdf_url)}
  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
>
  Preview PDF
</button>
```

---

### File 2: `src/pages/admin/OrderActions.tsx`

Apply the same pattern for the "Download PDF" button (line 224) which also uses `pdfUrl` directly.

---

### Why Not Just Use Public URLs?
The `generated-pdfs` bucket is private by design (PDFs contain personalized children's content). Keeping it private with on-demand signed URLs is the correct security approach.

### Why Not Store File Paths Instead?
While storing just the file path (e.g., `order-abc-final.pdf`) instead of the full signed URL would be cleaner, that would require a database migration and updating the PDF compilation function. The regex extraction approach works reliably and avoids breaking existing data.

---

### Testing
1. Go to Admin Dashboard, then Order Management
2. Click "Preview PDF" on any order with a generated PDF
3. The PDF should open successfully in a new tab with a fresh signed URL
4. The URL will be valid for 1 hour from the time of clicking

