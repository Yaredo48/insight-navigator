import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IngestBookRequest {
  title: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  description?: string;
  gradeId?: number;
  subjectId?: number;
  chapter?: number;
  version?: string;
  language?: string;
  sourceUrl?: string;
  officialSource?: string;
  publishedYear?: number;
  // For URL-based ingestion
  fileUrl?: string;
  // For direct file upload (base64)
  fileContent?: string;
  fileName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const bookData: IngestBookRequest = await req.json();

    console.log(`Ingesting book: ${bookData.title}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    let fileContent: Uint8Array;
    let fileSize: number;
    let extractedText = "";
    let pageCount = 0;

    // Step 1: Get file content (either from URL or base64)
    if (bookData.fileUrl) {
      console.log(`Downloading PDF from: ${bookData.fileUrl}`);
      const response = await fetch(bookData.fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      const blob = await response.blob();
      fileContent = new Uint8Array(await blob.arrayBuffer());
      fileSize = fileContent.length;
    } else if (bookData.fileContent && bookData.fileName) {
      console.log(`Processing uploaded file: ${bookData.fileName}`);
      const binaryString = atob(bookData.fileContent);
      fileContent = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        fileContent[i] = binaryString.charCodeAt(i);
      }
      fileSize = fileContent.length;
    } else {
      throw new Error("Either fileUrl or fileContent must be provided");
    }

    console.log(`File size: ${fileSize} bytes`);

    // Step 2: Extract text from PDF
    try {
      console.log("Extracting text from PDF...");
      
      // Use pdf-lib to extract text (simplified - in production use pdf.js)
      // For now, we'll do basic text extraction
      const pdfText = await extractTextFromPDF(fileContent);
      extractedText = pdfText.text || "";
      pageCount = pdfText.pageCount || 0;
      
      console.log(`Extracted ${extractedText.length} characters from ${pageCount} pages`);
    } catch (error) {
      console.error("Error extracting text:", error);
      extractedText = "";
    }

    // Step 3: Upload to Supabase Storage
    const storagePath = `books/${bookData.gradeId || 'general'}/${bookData.subjectId || 'general'}/${bookData.fileName || bookData.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    console.log(`Uploading to storage: ${storagePath}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('educational-content')
      .upload(storagePath, fileContent, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('educational-content')
      .getPublicUrl(storagePath);

    console.log(`File uploaded successfully: ${publicUrl}`);

    // Step 4: Register in books table
    const { data: bookRecord, error: dbError } = await supabase
      .from("books")
      .insert({
        title: bookData.title,
        author: bookData.author || null,
        publisher: bookData.publisher || null,
        isbn: bookData.isbn || null,
        description: bookData.description || null,
        grade_id: bookData.gradeId || null,
        subject_id: bookData.subjectId || null,
        chapter: bookData.chapter || null,
        version: bookData.version || null,
        language: bookData.language || 'en',
        file_name: bookData.fileName || `${bookData.title}.pdf`,
        file_size: fileSize,
        file_type: 'application/pdf',
        storage_path: storagePath,
        download_url: publicUrl,
        source_url: bookData.sourceUrl || null,
        official_source: bookData.officialSource || null,
        extracted_text: extractedText,
        is_processed: extractedText.length > 0,
        page_count: pageCount,
        published_year: bookData.publishedYear || null,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Failed to register book: ${dbError.message}`);
    }

    console.log(`Book registered successfully: ${bookRecord.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        bookId: bookRecord.id,
        storagePath: storagePath,
        downloadUrl: publicUrl,
        pageCount: pageCount,
        textLength: extractedText.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in ingest-book:", error);
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

// Helper function to extract text from PDF
async function extractTextFromPDF(pdfContent: Uint8Array): Promise<{ text: string; pageCount: number }> {
  // Basic PDF text extraction
  // In production, use pdf.js or a proper PDF parsing library
  
  try {
    // Convert to string for basic text extraction
    const pdfString = new TextDecoder().decode(pdfContent);
    
    // Simple extraction - look for text streams in PDF
    // This is a simplified approach; for production use pdf.js
    const textStreamRegex = /BT[\s\S]*?ET/g;
    const matches = pdfString.match(textStreamRegex);
    
    let extractedText = "";
    if (matches) {
      // Clean up the extracted text
      extractedText = matches
        .map(match => match.replace(/BT/g, '').replace(/ET/g, ''))
        .join(' ')
        .replace(/\\[\\d\\s]+/g, ' ')  // Remove PDF encoding
        .replace(/\\s+/g, ' ')          // Normalize whitespace
        .trim();
    }
    
    // Try to get page count from PDF
    const pageCountMatch = pdfString.match(/count\s+(\d+)/i);
    const pageCount = pageCountMatch ? parseInt(pageCountMatch[1]) || 1 : 1;
    
    return { text: extractedText, pageCount };
  } catch (error) {
    console.error("Error in PDF text extraction:", error);
    return { text: "", pageCount: 0 };
  }
}
