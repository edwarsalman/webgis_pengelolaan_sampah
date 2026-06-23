import { createClient } from "@supabase/supabase-js";

// Ganti dengan URL dan API Key dari dashboard Supabase Anda sendiri
const supabaseUrl = "https://snjdpahroqlkfmtiodrh.supabase.co";
const supabaseKey = "sb_publishable_ZPi3FcIBGMbogAyOIA5aaQ_iOfYaP2W";

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
);
