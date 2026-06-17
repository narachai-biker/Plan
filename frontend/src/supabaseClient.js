import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bpfepokjuvomdpjwklwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZmVwb2tqdXZvbWRwandrbHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzkyMDYsImV4cCI6MjA5NzIxNTIwNn0.jjsPIFNWY6rcBU1RVRPxBr3pSOmgaaTdU7RwYaHyrWQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
