import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert software requirements analyst. Your task is to critically analyze software requirements for completeness, quality, and clarity.

Analyze the provided requirements and provide a structured critique covering:

1. **Completeness Assessment** - Rate each category (Functional, Non-Functional, Domain, Constraints) as Complete, Partial, or Missing

2. **Quality Issues** - Identify:
   - Ambiguous or vague statements
   - Missing acceptance criteria
   - Conflicting requirements
   - Untestable requirements

3. **Recommendations** - Provide 3-5 specific, actionable improvements

4. **Risk Areas** - Highlight potential risks or gaps that could cause project issues

5. **Overall Score** - Rate the requirements quality as: Excellent, Good, Fair, or Needs Work

Be constructive and specific. Reference actual content from the requirements when pointing out issues.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectTitle, requirements } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `Please analyze the following software requirements for the project "${projectTitle}":

**Functional Requirements:**
${requirements.functional || "Not provided"}

**Non-Functional Requirements:**
${requirements.nonFunctional || "Not provided"}

**Domain Requirements:**
${requirements.domain || "Not provided"}

**Constraints/Exclusions:**
${requirements.inverse || "Not provided"}

Provide a detailed critique following the structured format.`;

    console.log("Analyzing requirements for:", projectTitle);

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
        max_tokens: 1000,
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
    const critique = data.choices?.[0]?.message?.content || "Unable to generate critique. Please try again.";

    console.log("Critique generated successfully");

    return new Response(
      JSON.stringify({ critique }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in requirement-critique function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});