import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lserzybsvugwnvhmszal.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZXJ6eWJzdnVnd252aG1zemFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MTQzNjIsImV4cCI6MjA3MjE5MDM2Mn0.lpf6ZJpVPQIMa_73CYl2K3kPYf4L2LY7ly_JbyJp-8s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);