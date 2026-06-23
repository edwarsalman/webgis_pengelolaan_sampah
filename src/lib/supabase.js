import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://snjdpahroqlkfmtiodrh.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_ZPi3FcIBGMbogAyOIA5aaQ_iOfYaP2W";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL atau ANON KEY tidak terdefinisi!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
