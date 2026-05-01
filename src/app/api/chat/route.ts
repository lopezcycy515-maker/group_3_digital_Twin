// API route for chat completions via OpenRouter
// POST /api/chat

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PERSONA, MAX_RESPONSE_TOKENS } from '@/lib/config';

function getOpenRouter() {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY ?? '',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': 'Digital Twin',
    },
  });
}

interface MessageParam {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, systemPrompt } = body as {
      messages: MessageParam[];
      systemPrompt?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 },
      );
    }

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: at least one message required' },
        { status: 400 },
      );
    }

    const finalSystemPrompt = systemPrompt || PERSONA;

    const response = await getOpenRouter().chat.completions.create({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      max_tokens: MAX_RESPONSE_TOKENS,
      messages: [
        { role: 'system', content: finalSystemPrompt },
        ...messages,
      ],
    });

    const reply = response.choices[0]?.message?.content;

    if (!reply) {
      return NextResponse.json(
        { error: 'Unexpected response from AI model' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        reply,
        modelId: response.model,
        stopReason: response.choices[0]?.finish_reason,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `API Error: ${error.message}` },
        { status: error.status || 500 },
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
