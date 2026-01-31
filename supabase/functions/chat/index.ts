import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Keywords that indicate the user is asking about books or textbook content
const BOOK_KEYWORDS = [
  "book", "textbook", "chapter", "page", "read", "chapter",
  "textbook", "syllabus", "curriculum", "lesson", "exercise",
  "paragraph", "section", "explain this chapter", "what does the book say",
  "in the textbook", "from the book", "according to the book"
];

// Check if a message is asking about book content
function isAskingAboutBooks(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return BOOK_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

// Get book context for the chat
async function getBookContext(
  supabase: ReturnType<typeof createClient>,
  gradeId: number | undefined,
  subjectId: number | undefined,
  searchQuery?: string
): Promise<string> {
  try {
    let query = supabase
      .from("books")
      .select("title, author, chapter, extracted_text")
      .eq("is_processed", true)
      .limit(5);

    if (gradeId) {
      query = query.eq("grade_id", gradeId);
    }

    if (subjectId) {
      query = query.eq("subject_id", subjectId);
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,extracted_text.ilike.%${searchQuery}%`);
    }

    query = query.order("chapter", { ascending: true });

    const { data: books, error } = await query;

    if (error || !books || books.length === 0) {
      console.log("No books found for context");
      return "";
    }

    const bookContext = books
      .filter(book => book.extracted_text && book.extracted_text.length > 0)
      .map(book => {
        const truncatedText = book.extracted_text?.substring(0, 3000) || "";
        return `## ${book.title}${book.chapter ? ` - Chapter ${book.chapter}` : ""}${book.author ? ` by ${book.author}` : ""}\n\n${truncatedText}`;
      })
      .join("\n\n---\n\n");

    return bookContext;
  } catch (error) {
    console.error("Error fetching book context:", error);
    return "";
  }
}

// Get system prompt based on role and context
function getSystemPrompt(role?: string, grade?: number, subject?: string): string {
  if (role === 'student') {
    return `You are "Insight Navigator," an AI learning assistant for Ethiopian secondary schools (Grades 9–12).

You are helping a ${grade ? `Grade ${grade}` : 'secondary school'} student${subject ? ` with ${subject}` : ''}.

## Your Role:
- Provide curriculum-aligned answers based on Ethiopian textbooks and educational materials
- Break down complex topics into step-by-step explanations suitable for ${grade ? `Grade ${grade}` : 'secondary school'} level
- Use examples and analogies that are relevant to Ethiopian students
- Ask comprehension questions to ensure understanding
- Provide exercises and practice problems when appropriate
- Encourage interactive learning with questions like "Do you understand? Would you like me to explain further?"

## Guidelines:
1. **Curriculum Alignment**: Base your answers on standard Ethiopian secondary school curriculum
2. **Grade-Appropriate**: Adjust complexity to ${grade ? `Grade ${grade}` : 'the appropriate grade'} level
3. **Step-by-Step**: Break down explanations into clear, manageable steps
4. **Examples**: Use practical examples relevant to Ethiopian context
5. **Interactive**: Ask follow-up questions to check understanding
6. **Exercises**: Suggest practice problems when appropriate
7. **Encouragement**: Be supportive and motivating
8. **Clarity**: Use simple, clear language

## Response Format:
- Use markdown for formatting
- Use bullet points for lists
- Use code blocks for formulas or equations
- Include examples and practice questions
- End with a comprehension check when appropriate

Remember: You are a patient, encouraging tutor helping Ethiopian students succeed in their studies.`;
  } else if (role === 'teacher') {
    return `You are "Insight Navigator," an AI assistant for Ethiopian secondary school teachers.

## Your Role:
- Provide teaching resources and pedagogical guidance
- Help create lesson plans aligned with Ethiopian curriculum
- Suggest teaching strategies and classroom activities
- Assist with assessment creation (quizzes, exercises)
- Provide insights on student progress and engagement
- Support classroom management and differentiated instruction

## Guidelines:
1. **Professional**: Maintain a professional, collegial tone
2. **Curriculum-Aligned**: Base suggestions on Ethiopian educational standards
3. **Practical**: Provide actionable, classroom-ready resources
4. **Evidence-Based**: Use proven teaching methodologies
5. **Culturally Relevant**: Consider Ethiopian educational context
6. **Comprehensive**: Cover planning, delivery, and assessment

## Response Format:
- Use markdown for formatting
- Provide structured lesson plans when requested
- Include learning objectives and outcomes
- Suggest assessment methods
- Offer differentiation strategies

Remember: You are a professional development resource helping teachers deliver excellent education.`;
  }

  // Default general assistant prompt
  return `You are an AI-powered educational assistant for Ethiopian secondary schools (Grades 9–12).

## Core Principles:
1. **Accuracy**: Provide accurate, curriculum-aligned information
2. **Clarity**: Use clear, accessible language
3. **Engagement**: Make learning interactive and interesting
4. **Support**: Be helpful, patient, and encouraging
5. **Context**: Consider the Ethiopian educational context

## Response Format:
- Use markdown for formatting
- Provide clear explanations
- Include examples when helpful
- Suggest next steps or related topics

Remember: Your goal is to support learning and teaching in Ethiopian secondary education.`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, conversationId, documentContext, role, grade, subject } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");

      return new Response(
        JSON.stringify({
          error: "AI service not configured. Please provide a Gemini API key.",
          details: "GEMINI_API_KEY environment variable is missing"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Build system prompt based on role and context
    let systemContent = getSystemPrompt(role, grade, subject);

    // Add document context if provided
    if (documentContext) {
      systemContent += `\n\n## Available Reference Materials:\n${documentContext}`;
    }

    // Add grade and subject context
    if (grade && subject) {
      systemContent += `\n\n## Current Context:\n- Grade: ${grade}\n- Subject: ${subject}\n\nPlease tailor your responses to this specific grade level and subject.`;
    }

    // Auto-fetch book context if grade and subject are present AND documentContext is not already providing it
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const isExplicitlyAsking = isAskingAboutBooks(lastUserMessage);
    const hasBookContextInDocument = documentContext && documentContext.includes("## Selected Textbooks:");

    console.log("Chat context:", { role, grade, subject, isExplicitlyAsking, hasBookContextInDocument });

    if (grade && (subject || isExplicitlyAsking) && !hasBookContextInDocument) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const supabase = createClient(supabaseUrl, supabaseKey);

      let subjectId: number | undefined;

      if (subject) {
        console.log(`Searching for subject ID for: ${subject}`);
        const { data: subjectData, error: subjectError } = await supabase
          .from("subjects")
          .select("id")
          .ilike("name", subject)
          .maybeSingle();

        if (subjectError) {
          console.error("Error fetching subject ID:", subjectError);
        } else {
          subjectId = subjectData?.id;
          console.log(`Found subject ID: ${subjectId}`);
        }
      }

      let gradeId: number | undefined;
      if (typeof grade === "number") {
        gradeId = grade;
      } else if (grade) {
        const match = grade.toString().match(/(\d+)/);
        if (match) {
          gradeId = parseInt(match[1]);
        }
      }

      console.log(`Fetching book context for Grade: ${gradeId}, Subject: ${subjectId}`);
      try {
        const bookContext = await getBookContext(supabase, gradeId, subjectId, lastUserMessage);
        if (bookContext) {
          console.log(`Found ${bookContext.length} characters of book context`);
          systemContent += `\n\n## Textbook Content:\n${bookContext}\n\nWhen answering questions about the textbook, use the content above as your primary source. Cite specific chapters and sections when appropriate.`;
        } else {
          console.log("No book context found");
        }
      } catch (err) {
        console.error("Error in getBookContext helper:", err);
      }
    }

    // Map messages to Gemini format
    const geminiMessages = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Call Gemini API with streaming - Fixed model name from gemini-2.5-flash to gemini-1.5-flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: geminiMessages,
        systemInstruction: {
          parts: [{ text: systemContent }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response.", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform Gemini stream to OpenAI-compatible SSE format
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);

        // Gemini stream is a JSON array of objects, one per chunk
        // The format is like: [ { "candidates": [ { "content": { "parts": [ { "text": "..." } ] } } ] } ]
        // Sometimes it sends multiple objects in one chunk or partial objects.

        // Simpler approach: Gemini often sends one complete JSON object per chunk in SSE
        // But the browser fetch body is a raw binary stream.

        // For simplicity and to avoid complex parsing of partial JSON chunks, 
        // we'll try to find the text parts.

        try {
          // Gemini SSE usually starts with [ or , or ] if it's the whole array
          // But it's actually not SSE by default from fetch, it's just raw chunks.
          // We'll use a regex to extract text parts from the chunk.
          const textMatches = text.matchAll(/"text":\s*"((?:[^"\\]|\\.)*)"/g);
          for (const match of textMatches) {
            let content = match[1];
            // Unescape the string
            content = content.replace(/\\n/g, '\n').replace(/\\"/g, '"');

            const payload = {
              choices: [
                {
                  delta: { content },
                  index: 0,
                  finish_reason: null
                }
              ]
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          }
        } catch (e) {
          console.error("Error transforming chunk:", e);
        }
      },
      flush(controller) {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      }
    });

    const outputStream = response.body?.pipeThrough(transformStream);

    return new Response(outputStream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
