import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookContextRequest {
  gradeId?: number;
  subjectId?: number;
  searchQuery?: string;
  chapter?: number;
  limit?: number;
}

interface BookResult {
  id: string;
  title: string;
  author: string | null;
  chapter: number | null;
  extracted_text: string | null;
  storage_path: string;
  download_url: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { gradeId, subjectId, searchQuery, chapter, limit = 5 }: BookContextRequest = await req.json();

    console.log(`Fetching book context - Grade: ${gradeId}, Subject: ${subjectId}, Query: ${searchQuery}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query to fetch relevant books
    let query = supabase
      .from("books")
      .select(`
        id,
        title,
        author,
        chapter,
        extracted_text,
        storage_path,
        download_url
      `)
      .eq("is_processed", true)
      .limit(limit);

    // Apply filters
    if (gradeId) {
      query = query.eq("grade_id", gradeId);
    }
    
    if (subjectId) {
      query = query.eq("subject_id", subjectId);
    }
    
    if (chapter) {
      query = query.eq("chapter", chapter);
    }

    // If there's a search query, try to filter by title or content
    if (searchQuery) {
      // Use ilike for title matching
      query = query.or(`title.ilike.%${searchQuery}%,extracted_text.ilike.%${searchQuery}%`);
    }

    // Order by chapter if specified
    query = query.order("chapter", { ascending: true });

    const { data: books, error } = await query;

    if (error) {
      console.error("Error fetching books:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch books", details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${books?.length || 0} relevant books`);

    // Format the book context for the AI
    const bookContext = books
      ?.filter((book: BookResult) => book.extracted_text && book.extracted_text.length > 0)
      .map((book: BookResult) => {
        // Truncate extracted text to avoid token limits (first 5000 characters)
        const truncatedText = book.extracted_text?.substring(0, 5000) || "";
        
        return `
## Book: ${book.title}
${book.author ? `Author: ${book.author}` : ""}
${book.chapter ? `Chapter: ${book.chapter}` : ""}

Content:
${truncatedText}
---
`;
      })
      .join("\n");

    return new Response(
      JSON.stringify({
        success: true,
        bookCount: books?.length || 0,
        context: bookContext || "",
        books: books?.map((book: BookResult) => ({
          id: book.id,
          title: book.title,
          chapter: book.chapter,
          downloadUrl: book.download_url,
        })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in get-book-context:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
