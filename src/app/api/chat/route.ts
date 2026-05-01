// API route for chat completions via OpenRouter
// POST /api/chat

import { NextRequest, NextResponse } from 'next/server';
import { PERSONA, MAX_RESPONSE_TOKENS } from '@/lib/config';

interface MessageParam {
  role: 'user' | 'assistant';
  content: string;
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

export async function POST(request: NextRequest) {
  try {
    // Validate API key is present at request time (clear error if missing in Vercel)
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY is missing or empty in environment');
      return NextResponse.json(
        {
          error:
            'Server misconfigured: OPENROUTER_API_KEY is not set. Please add it to Vercel environment variables (Production scope) and redeploy.',
        },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { messages, systemPrompt } = body as {
      messages: MessageParam[];
      systemPrompt?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: non-empty messages array required' },
        { status: 400 },
      );
    }

    const finalSystemPrompt = systemPrompt || PERSONA;

    const orRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Group 3 Digital Twin',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_RESPONSE_TOKENS,
        messages: [
          { role: 'system', content: finalSystemPrompt },
          ...messages,
        ],
      }),
    });

    if (!orRes.ok) {
      const errText = await orRes.text();
      console.error('OpenRouter error:', orRes.status, errText);
      return NextResponse.json(
        { error: `OpenRouter ${orRes.status}: ${errText.slice(0, 300)}` },
        { status: orRes.status },
      );
    }

    const data = await orRes.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      console.error('Unexpected OpenRouter response:', data);
      return NextResponse.json(
        { error: 'Unexpected response from AI model' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        reply,
        modelId: data.model,
        stopReason: data.choices?.[0]?.finish_reason,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
