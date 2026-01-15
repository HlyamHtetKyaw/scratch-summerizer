// Setup:
// 1. Run `supabase functions new transcribe`
// 2. Add your API key: `supabase secrets set GEMINI_API_KEY=...`

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Log 1: Request received
  console.log(`[LOG] Request received: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { audio, mimeType } = body;

    // Log 2: Payload details (Avoid logging the full base64 string, just length)
    if (audio) {
      console.log(`[LOG] Audio received. Length: ${audio.length} chars. MimeType: ${mimeType || 'default'}`);
    } else {
      console.error("[ERROR] No audio data found in body.");
      throw new Error("No audio data provided");
    }

    // Initialize Gemini
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error("[ERROR] GEMINI_API_KEY is missing from secrets.");
      throw new Error("Server configuration error: Missing API Key");
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Log 3: Model Initialization
    const modelName = "gemini-2.5-flash"; // Updated to current available experimental model or use 1.5-flash
    console.log(`[LOG] Initializing model: ${modelName}`);

    const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { responseMimeType: "application/json" } 
    });

    const prompt = "Transcribe the following audio exactly as spoken. Return a JSON object with a single key 'transcription' containing the text.";

    // Log 4: Calling Gemini API
    console.log("[LOG] Sending request to Gemini API...");
    
    const startTime = Date.now(); // Track timing

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType || 'audio/webm',
              data: audio 
            }
          }
        ]
      }]
    });

    const duration = Date.now() - startTime;
    console.log(`[LOG] Gemini response received in ${duration}ms`);

    const responseText = result.response.text();

    // Log 5: Inspect the raw response text from Gemini
    console.log(`[LOG] Raw Response from Gemini: ${responseText}`);

    return new Response(responseText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Log 6: Error handling
    console.error(`[ERROR] Processing failed:`, error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
