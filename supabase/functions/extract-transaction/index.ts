import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const GEMINI_MODEL = 'gemini-2.5-flash';

const EXTRACTION_PROMPT = `You are reading an Indian UPI payment screenshot from apps like GPay, PhonePe, or Paytm.

Extract these fields:
- amount: the payment amount in INR as a number (no currency symbol)
- merchant: the payee or merchant name
- date: transaction date in YYYY-MM-DD format

Rules:
- If the year is missing, assume the current year.
- If multiple amounts appear, use the final paid amount.
- If merchant is unclear, use the best guess from visible text.
- Return JSON only with keys: amount, merchant, date`;

interface ExtractedTransaction {
  amount: number;
  merchant: string;
  date: string;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function parseGeminiJson(text: string): ExtractedTransaction {
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  const amount = Number(parsed.amount);
  const merchant = String(parsed.merchant ?? '').trim();
  const date = String(parsed.date ?? '').trim();

  if (!amount || amount <= 0 || !merchant || !date) {
    throw new Error('Incomplete extraction result from AI.');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Invalid date format from AI.');
  }

  return { amount, merchant, date };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return jsonResponse(
        { error: 'GEMINI_API_KEY is not configured in Supabase secrets.' },
        500,
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header.' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized.' }, 401);
    }

    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return jsonResponse(
        { error: 'imageBase64 and mimeType are required.' },
        400,
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(mimeType)) {
      return jsonResponse(
        { error: 'Only JPG and PNG images are supported.' },
        400,
      );
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: EXTRACTION_PROMPT },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: {
                amount: { type: 'number' },
                merchant: { type: 'string' },
                date: { type: 'string' },
              },
              required: ['amount', 'merchant', 'date'],
            },
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error:', errText);
      return jsonResponse(
        { error: 'Failed to extract details from the screenshot.' },
        502,
      );
    }

    const geminiData = await geminiResponse.json();
    const text =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!text) {
      return jsonResponse(
        { error: 'Could not read transaction details from this screenshot.' },
        422,
      );
    }

    const extracted = parseGeminiJson(text);
    return jsonResponse({ data: extracted });
  } catch (error) {
    console.error('extract-transaction error:', error);
    const message =
      error instanceof Error ? error.message : 'Unexpected server error.';
    return jsonResponse({ error: message }, 500);
  }
});
