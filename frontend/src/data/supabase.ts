import { createClient } from '@supabase/supabase-js';
import { useDiagnosticsStore } from '../state/diagnosticsStore';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  setTimeout(() => {
    useDiagnosticsStore.getState().addError({
      type: 'env',
      message: 'Supabase credentials missing',
      hint: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY',
      recommendedFix: 'Check your frontend/.env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly.'
    });
  }, 1000);
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

// Startup Health Check
export const checkSupabaseHealth = async () => {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    const { error: dbError } = await supabase.from('whatsapp_conversations').select('id').limit(1);
    if (dbError) throw dbError;
    
    // Status is good. No need to show error.
  } catch (error: any) {
    let type: 'db' | 'auth' | 'network' = 'db';
    let hint = error.message;
    let recommendedFix = 'Check your Supabase project status.';

    if (error.message?.includes('fetch failed') || error.message?.includes('Failed to fetch')) {
       type = 'network';
       hint = 'Network connection failed. Supabase might be paused or unreachable.';
       recommendedFix = 'Go to Supabase Dashboard and check if the project is "Paused". If so, click Restore. Also check your internet connection.';
    } else if (error.status === 401 || error.status === 403) {
       type = 'auth';
       hint = 'Authentication or RLS error. Invalid ANON key or RLS is blocking access.';
       recommendedFix = 'Verify VITE_SUPABASE_ANON_KEY. Ensure RLS policies allow access to whatsapp_conversations.';
    }

    useDiagnosticsStore.getState().addError({
      type,
      status: error.status,
      message: 'Supabase Health Check Failed ❌',
      hint,
      recommendedFix,
    });
  }
};

// Run health check on load
setTimeout(checkSupabaseHealth, 1000);
