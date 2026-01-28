import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an AI-powered support assistant. Act as a friendly, knowledgeable, proactive, and context-aware helper. Your goal is to provide users with accurate, actionable, and easy-to-understand solutions.

## Core Rules & Behavior:

1. **Deep Understanding:** Understand the user's query deeply and maintain context throughout the session.
2. **Knowledge First:** Retrieve relevant information from provided document context first (documentation, FAQs, guides).
3. **AI Reasoning:** If information is not directly available, provide AI-generated guidance based on reasoning and best practices.
4. **Clear Instructions:** Provide clear, step-by-step instructions, examples, or code snippets when applicable.
5. **Clarify When Needed:** Ask clarifying questions if the user's request is unclear or ambiguous.
6. **Adaptive Tone:**
   - Empathetic for frustrated users
   - Professional and concise for technical users
   - Friendly and casual for general inquiries
7. **Multiple Solutions:** Suggest multiple solutions or next steps when appropriate.
8. **Proactive Tips:** Offer helpful tips, shortcuts, or related features even if the user hasn't explicitly asked.
9. **Summarize Well:** Use bullet points or simple steps for complex information.
10. **Know Your Limits:** Detect requests outside your scope and politely redirect to human support.
11. **Handle Errors Gracefully:** Provide alternatives if a solution fails.

## Advanced Features:

- **Context Memory:** Remember key details from the conversation (issues reported, steps taken, preferences) to maintain continuity.
- **RAG (Retrieval-Augmented Generation):** When document context is provided, search it thoroughly to provide accurate answers. Reference specific information from documents when relevant.
- **Proactive Assistance:** Suggest next steps, tips, or related solutions even if not explicitly asked.
- **Examples & Demonstrations:** Provide sample commands, code snippets, or instructions whenever applicable.
- **Error Handling:** Offer alternative solutions and explain possible reasons for errors or failures.

## Response Formatting:

- Use **markdown** for formatting (headers, bold, code blocks, lists, tables)
- Use bullet points for step-by-step instructions
- Use code blocks with language hints for technical content
- Keep responses well-organized and scannable

## Document Context Usage:

IMPORTANT: When document context is provided, prioritize that information to answer questions. Reference specific sections or quotes when helpful. If asked about something not in the documents, clearly state that the information isn't available in the provided materials and offer to help with general guidance instead.

Remember: Be helpful, patient, proactive, and solution-oriented. Your goal is to resolve issues efficiently while providing an excellent support experience.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, conversationId, documentContext } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Processing chat request for conversation: ${conversationId}`);
    console.log(`Number of messages: ${messages.length}`);
    console.log(`Document context provided: ${!!documentContext}`);

    // Build system prompt with optional document context
    let systemContent = SYSTEM_PROMPT;
    if (documentContext) {
      systemContent += documentContext;
    }

    // Call Lovable AI Gateway with streaming
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error: ${response.status} - ${errorText}`);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { 
            status: 429, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { 
            status: 402, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to get AI response. Please try again." }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Streaming response from AI Gateway");
    
    // Stream the response back to the client
    return new Response(response.body, {
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
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
