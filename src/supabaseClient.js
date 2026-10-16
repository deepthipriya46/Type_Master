import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  'https://gxelksgspezrjifpumdt.supabase.co';

const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4ZWxrc2dzcGV6cmppZnB1bWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MzUyNzcsImV4cCI6MjEwNzAxMTI3N30.MuUgRxNXKtef-9sWI7LDswZgLQsjP_pcCl9J8BeX36g';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
