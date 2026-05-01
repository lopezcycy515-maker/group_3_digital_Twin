// Supabase client initialization

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database operations
export interface ConversationRow {
  id: string;
  user_id?: string;
  messages: unknown;
  metadata?: unknown;
  created_at: string;
  updated_at: string;
}

export interface LeadRow {
  id: string;
  name: string;
  email: string;
  company?: string;
  role?: string;
  conversation_id: string;
  created_at: string;
}

// Database operations

export async function saveConversation(conversationId: string, messages: unknown, metadata?: unknown) {
  const { data, error } = await supabase
    .from('conversations')
    .upsert({
      id: conversationId,
      messages,
      metadata,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving conversation:', error);
    throw error;
  }

  return data;
}

export async function saveLead(lead: Omit<LeadRow, 'created_at'>) {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...lead,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving lead:', error);
    throw error;
  }

  return data;
}

export async function getConversation(conversationId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found" error, which is normal
    console.error('Error fetching conversation:', error);
  }

  return data;
}
