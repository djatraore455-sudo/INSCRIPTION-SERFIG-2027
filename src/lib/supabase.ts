import { createClient } from '@supabase/supabase-js';

const supabaseUrl: string =
  import.meta.env.VITE_SUPABASE_URL || 'https://prygzytudhecilduypkw.supabase.co';
const supabasePublishableKey: string =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_abJWxplksLjvXWMi4MnWZQ_BBG8zrHJ';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
