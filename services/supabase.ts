
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

// Helper to get environment variables across different environments (Node, Vite, etc.)
const getEnv = (key: string): string | undefined => {
  try {
    // Attempt process.env
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
    // Attempt import.meta.env (for Vite/ESM environments)
    if (typeof (import.meta as any).env !== 'undefined' && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  } catch (e) {
    // Ignore errors in env access
  }
  return undefined;
};

const supabaseUrl = getEnv('SUPABASE_URL') || 'https://your-project.supabase.co';
const supabaseKey = getEnv('SUPABASE_ANON_KEY') || 'your-anon-key';

// Check if we are using placeholder values and log a warning
if (supabaseUrl.includes('your-project') || supabaseKey === 'your-anon-key') {
  console.warn("EduExam: Supabase environment variables are missing. Please configure SUPABASE_URL and SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type DbExam = {
  id: string;
  short_code: string;
  title: string;
  month: number;
  mode: string;
  duration_minutes: number;
  questions_json: any;
  created_at: string;
};

export type DbAttempt = {
  id: string;
  exam_short_code: string;
  first_name: string;
  last_name: string;
  started_at: string;
  submitted_at: string | null;
  score: number;
  correct_count: number;
  wrong_count: number;
  answers_json: any;
  status: 'in_progress' | 'finished' | 'timeout';
};

export type DbSession = {
  id: string;
  join_code: string;
  exam_short_code: string;
  status: 'active' | 'ended';
  created_at: string;
};
