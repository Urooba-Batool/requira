import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Requira, an expert AI requirements analyst. Your role is to gather comprehensive software requirements through intelligent conversation.

Your objectives:
1. Ask thoughtful, probing questions to understand the project deeply
2. Categorize responses into: functional requirements, non-functional requirements, domain requirements, and inverse requirements (what should NOT happen)
3. Identify ambiguities, conflicts, or missing information
4. Guide the conversation naturally while ensuring complete coverage

Guidelines:
- Ask ONE focused question at a time
- Acknowledge and summarize what the user says before asking the next question
- After gathering sufficient information (typically 4-6 exchanges), offer to summarize and submit
- Be professional but friendly
- If the user's response is vague, ask clarifying follow-up questions

When you believe you have gathered enough requirements, include the phrase "REQUIREMENTS_COMPLETE" at the end of your response.

Format your responses naturally as a conversation, not as a list.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, projectTitle, clientName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the full message history for context
    const systemMessage = {
      role: "system",
      content: `${SYSTEM_PROMPT}\n\nProject: "${projectTitle}"\nClient: ${clientName}`
    };

    const formattedMessages = messages.map((msg: { role: string; text: string }) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.text
    }));

    console.log("Calling Lovable AI with messages:", formattedMessages.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [systemMessage, ...formattedMessages],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I'm having trouble processing that. Could you please rephrase?";
    
    // Check if requirements are complete
    const isComplete = aiResponse.includes("REQUIREMENTS_COMPLETE");
    const cleanResponse = aiResponse.replace("REQUIREMENTS_COMPLETE", "").trim();

    console.log("AI response received, isComplete:", isComplete);

    return new Response(
      JSON.stringify({ 
        response: cleanResponse,
        isComplete 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in requirement-chat function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});