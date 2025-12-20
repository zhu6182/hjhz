
import { createClient } from '@supabase/supabase-js';

// 这些变量需要你在 .env.local 中配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Key is missing! Please check .env.local');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
