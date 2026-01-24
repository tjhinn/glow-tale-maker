import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's auth to check admin role
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check if user is admin
    const { data: roleData, error: roleError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { dryRun = false } = await req.json().catch(() => ({}));

    // Create service role client for storage operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get all story IDs (these folders should be preserved in story-images)
    const { data: stories, error: storiesError } = await adminClient
      .from("stories")
      .select("id");

    if (storiesError) {
      throw new Error(`Failed to fetch stories: ${storiesError.message}`);
    }

    const storyIds = new Set(stories?.map((s) => s.id) || []);
    console.log(`Found ${storyIds.size} story templates to preserve:`, Array.from(storyIds));

    const results = {
      storyImages: { deleted: [] as string[], preserved: [] as string[], errors: [] as string[] },
      heroPhotos: { deleted: [] as string[], errors: [] as string[] },
      generatedPdfs: { deleted: [] as string[], errors: [] as string[] },
      orderImages: { deleted: [] as string[], errors: [] as string[] },
      dryRun,
    };

    // Clean up story-images bucket (preserve story template folders)
    const { data: storyImageFolders, error: listError } = await adminClient.storage
      .from("story-images")
      .list("", { limit: 1000 });

    if (listError) {
      console.error("Error listing story-images:", listError);
      results.storyImages.errors.push(`List error: ${listError.message}`);
    } else if (storyImageFolders) {
      for (const item of storyImageFolders) {
        // Check if this is a folder (no metadata means it's a folder prefix)
        const folderId = item.name;
        
        if (storyIds.has(folderId)) {
          results.storyImages.preserved.push(folderId);
          console.log(`Preserving story template folder: ${folderId}`);
        } else {
          // This is an orphaned order folder - delete all contents
          console.log(`Found orphaned folder to delete: ${folderId}`);
          
          // List all files in the folder
          const { data: files, error: filesError } = await adminClient.storage
            .from("story-images")
            .list(folderId, { limit: 1000 });

          if (filesError) {
            results.storyImages.errors.push(`Error listing ${folderId}: ${filesError.message}`);
            continue;
          }

          if (files && files.length > 0) {
            const filePaths = files.map((f) => `${folderId}/${f.name}`);
            
            if (!dryRun) {
              const { error: deleteError } = await adminClient.storage
                .from("story-images")
                .remove(filePaths);

              if (deleteError) {
                results.storyImages.errors.push(`Error deleting ${folderId}: ${deleteError.message}`);
              } else {
                results.storyImages.deleted.push(...filePaths);
              }
            } else {
              results.storyImages.deleted.push(...filePaths);
            }
          }
        }
      }
    }

    // Clean up order-images bucket entirely (all are order-specific)
    const { data: orderImageFiles, error: orderListError } = await adminClient.storage
      .from("order-images")
      .list("", { limit: 1000 });

    if (orderListError) {
      console.error("Error listing order-images:", orderListError);
      results.orderImages.errors.push(`List error: ${orderListError.message}`);
    } else if (orderImageFiles) {
      for (const folder of orderImageFiles) {
        const { data: files } = await adminClient.storage
          .from("order-images")
          .list(folder.name, { limit: 1000 });

        if (files && files.length > 0) {
          const filePaths = files.map((f) => `${folder.name}/${f.name}`);
          
          if (!dryRun) {
            const { error: deleteError } = await adminClient.storage
              .from("order-images")
              .remove(filePaths);

            if (deleteError) {
              results.orderImages.errors.push(`Error deleting: ${deleteError.message}`);
            } else {
              results.orderImages.deleted.push(...filePaths);
            }
          } else {
            results.orderImages.deleted.push(...filePaths);
          }
        }
      }
    }

    // Clean up hero-photos bucket
    const { data: heroPhotos, error: heroListError } = await adminClient.storage
      .from("hero-photos")
      .list("", { limit: 1000 });

    if (heroListError) {
      console.error("Error listing hero-photos:", heroListError);
      results.heroPhotos.errors.push(`List error: ${heroListError.message}`);
    } else if (heroPhotos && heroPhotos.length > 0) {
      const filePaths = heroPhotos.map((f) => f.name);
      
      if (!dryRun) {
        const { error: deleteError } = await adminClient.storage
          .from("hero-photos")
          .remove(filePaths);

        if (deleteError) {
          results.heroPhotos.errors.push(`Error deleting: ${deleteError.message}`);
        } else {
          results.heroPhotos.deleted.push(...filePaths);
        }
      } else {
        results.heroPhotos.deleted.push(...filePaths);
      }
    }

    // Clean up generated-pdfs bucket
    const { data: pdfs, error: pdfListError } = await adminClient.storage
      .from("generated-pdfs")
      .list("", { limit: 1000 });

    if (pdfListError) {
      console.error("Error listing generated-pdfs:", pdfListError);
      results.generatedPdfs.errors.push(`List error: ${pdfListError.message}`);
    } else if (pdfs && pdfs.length > 0) {
      const filePaths = pdfs.map((f) => f.name);
      
      if (!dryRun) {
        const { error: deleteError } = await adminClient.storage
          .from("generated-pdfs")
          .remove(filePaths);

        if (deleteError) {
          results.generatedPdfs.errors.push(`Error deleting: ${deleteError.message}`);
        } else {
          results.generatedPdfs.deleted.push(...filePaths);
        }
      } else {
        results.generatedPdfs.deleted.push(...filePaths);
      }
    }

    const summary = {
      dryRun,
      storyImages: {
        deletedCount: results.storyImages.deleted.length,
        preservedCount: results.storyImages.preserved.length,
        preserved: results.storyImages.preserved,
        errors: results.storyImages.errors,
      },
      orderImages: {
        deletedCount: results.orderImages.deleted.length,
        errors: results.orderImages.errors,
      },
      heroPhotos: {
        deletedCount: results.heroPhotos.deleted.length,
        errors: results.heroPhotos.errors,
      },
      generatedPdfs: {
        deletedCount: results.generatedPdfs.deleted.length,
        errors: results.generatedPdfs.errors,
      },
    };

    console.log("Cleanup complete:", JSON.stringify(summary, null, 2));

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Cleanup failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
