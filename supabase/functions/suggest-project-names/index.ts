import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert at naming software projects. Based on the provided project requirements and conversation history, generate 5 creative, professional, and memorable project names.

Guidelines for naming:
- Names should be easy to remember and pronounce
- Names should reflect the project's purpose or domain
- Mix of styles: some can be single words, compound words, or short phrases
- Consider tech industry naming conventions
- Names should be suitable for branding and documentation
- Avoid generic names like "Project Manager" or "Task App"
- Be creative but professional

Return ONLY a JSON array of 5 name suggestions, nothing else. Example format:
["ProjectName1", "ProjectName2", "ProjectName3", "ProjectName4", "ProjectName5"]`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectTitle, requirements, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from conversation and requirements
    const conversationSummary = conversationHistory
      ?.map((msg: { role: string; text: string }) => `${msg.role}: ${msg.text}`)
      .join('\n') || '';

    const requirementsSummary = Object.entries(requirements || {})
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const userPrompt = `Current project title: "${projectTitle}"

Project Requirements:
${requirementsSummary || 'No structured requirements yet'}

Conversation History (client's description of the project):
${conversationSummary || 'No conversation history'}

Based on the above information, suggest 5 creative and professional project names.`;

    console.log("Calling Lovable AI for project name suggestions");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 300,
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
    const aiResponse = data.choices?.[0]?.message?.content || "[]";
    
    console.log("AI response:", aiResponse);

    // Parse the JSON array from the response
    let suggestions: string[] = [];
    try {
      // Extract JSON array from response (handle markdown code blocks)
      const jsonMatch = aiResponse.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Error parsing suggestions:", parseError);
      // Fallback: try to extract names from text
      const lines = aiResponse.split('\n').filter((line: string) => line.trim());
      suggestions = lines.slice(0, 5).map((line: string) => line.replace(/^[\d\.\-\*\s]+/, '').trim());
    }

    // Ensure we have exactly 5 suggestions
    while (suggestions.length < 5) {
      suggestions.push(`${projectTitle} ${suggestions.length + 1}`);
    }
    suggestions = suggestions.slice(0, 5);

    console.log("Parsed suggestions:", suggestions);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in suggest-project-names function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
