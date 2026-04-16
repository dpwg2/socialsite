import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://vtlrgypkqcmfsnbquqzd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bHJneXBrcWNtZnNuYnF1cXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMjExNjAsImV4cCI6MjA5MTc5NzE2MH0.3QJKKwMwlYpUw4PWRiwssna0WYLVQo4bCo665RdiQwg'
);
