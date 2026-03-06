import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sabewasybcopihdjcnmb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhYmV3YXN5YmNvcGloZGpjbm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjYxMzUsImV4cCI6MjA4NTkwMjEzNX0.gN-xXCATGz6sgJOTpaT3mFmGc6eKbXUqOrroopjMtnM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);