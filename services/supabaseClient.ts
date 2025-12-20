
import { createClient } from '@supabase/supabase-js';

// 这些变量需要你在 .env.local 中配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Initializing Supabase Client...");
console.log("URL Configured:", !!supabaseUrl, supabaseUrl ? supabaseUrl.substring(0, 15) + "..." : "MISSING");
console.log("Key Configured:", !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.warn('Supabase URL or Key is missing or invalid! Using mock client.');
}

// 如果缺少配置，创建一个假的客户端，避免应用崩溃
export const supabase = (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');
