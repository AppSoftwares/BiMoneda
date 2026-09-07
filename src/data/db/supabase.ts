import { createClient } from '@supabase/supabase-js';
import { Database } from '../entity/database.types';

// Hardcoded production keys to ensure the app works across all platforms without extra config
const supabaseUrl = 'https://nkhhkpunrgjcrzixidcu.supabase.co';
const supabaseAnonKey = 'sb_publishable_tyDoUvHV_iMqcIwfpxQWow_yxXNpLEg';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
