import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a professional technical writer specializing in Software Requirements Specification (SRS) documents. Your task is to take raw requirements from a client and organize them into a properly structured SRS document format.

You MUST return a valid JSON object with the following structure:
{
  "introduction": {
    "purpose": "A clear statement of the document's purpose",
    "scope": "Description of the system scope and boundaries"
  },
  "overallDescription": {
    "productPerspective": "How this product fits within a larger system or workflow",
    "userCharacteristics": "Description of user types and their skill levels"
  },
  "systemFeatures": [
    {
      "title": "Feature name",
      "description": "Detailed description of the feature",
      "inputs": "What inputs the feature accepts",
      "outputs": "What outputs the feature produces",
      "behavior": "How the feature behaves"
    }
  ],
  "nonFunctionalRequirements": {
    "performance": ["List of performance requirements"],
    "security": ["List of security requirements"],
    "usability": ["List of usability requirements"],
    "reliability": ["List of reliability requirements"],
    "other": ["Other non-functional requirements"]
  },
  "externalInterfaces": {
    "userInterface": "UI requirements description",
    "hardware": "Hardware interface requirements",
    "software": "Software interface requirements",
    "communication": "Communication interface requirements"
  },
  "constraints": ["List of constraints and exclusions"]
}

Guidelines:
- Extract and organize ALL requirements from the provided information
- Infer reasonable details where information is limited
- Use clear, professional technical language
- Each feature should be a distinct, actionable system capability
- Categorize non-functional requirements accurately
- If certain sections have no applicable requirements, provide sensible defaults or mark as "To be determined"
- Return ONLY the JSON object, no markdown or additional text`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectTitle, projectDescription, requirements, clientName, companyName } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const userPrompt = `Please organize the following project requirements into a structured SRS document format.

PROJECT INFORMATION:
- Title: ${projectTitle}
- Description: ${projectDescription || 'Not provided'}
- Client: ${clientName}
- Company: ${companyName}

RAW REQUIREMENTS:

FUNCTIONAL REQUIREMENTS:
${requirements.functional || 'No functional requirements provided'}

NON-FUNCTIONAL REQUIREMENTS:
${requirements.nonFunctional || 'No non-functional requirements provided'}

DOMAIN REQUIREMENTS:
${requirements.domain || 'No domain requirements provided'}

CONSTRAINTS/EXCLUSIONS:
${requirements.inverse || 'No constraints provided'}

Please analyze these requirements and return a properly structured SRS JSON object.`;

    console.log('Calling Lovable AI to format SRS...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response received, parsing JSON...');
    
    // Clean up the response - remove markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.slice(7);
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.slice(3);
    }
    if (cleanContent.endsWith('```')) {
      cleanContent = cleanContent.slice(0, -3);
    }
    cleanContent = cleanContent.trim();

    const srsData = JSON.parse(cleanContent);
    
    console.log('SRS data parsed successfully');

    return new Response(JSON.stringify({ srsData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in format-srs function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to format SRS';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});