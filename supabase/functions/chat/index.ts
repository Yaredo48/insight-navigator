import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      console.error("Please set LOVABLE_API_KEY in supabase/.env file");

      // Return a helpful error message
      return new Response(
        JSON.stringify({
          error: "AI service not configured. Please contact administrator.",
          details: "LOVABLE_API_KEY environment variable is missing"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Processing chat request for conversation: ${conversationId}`);
    console.log(`Role: ${role}, Grade: ${grade}, Subject: ${subject}`);
    console.log(`Number of messages: ${messages.length}`);
    console.log(`Document context provided: ${!!documentContext}`);

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

    console.log("Calling AI Gateway...");

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

      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Invalid API key. Please check your configuration." }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Failed to get AI response. Please try again.",
          details: errorText
        }),
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
