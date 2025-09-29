import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ybokmjlxpwjdhcyryzbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlib2ttamx4cHdqZGhjeXJ5emJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODEzMDUsImV4cCI6MjA3Mjc1NzMwNX0.ZtbFSCnXM3NWLzDy13J2_bQDL5FON9oUXvV3y2tBDtM';

export const supabase = createClient(supabaseUrl, supabaseKey);
