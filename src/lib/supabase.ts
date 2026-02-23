import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadImage(file: File, path: string): Promise<string> {
  const { error } = await supabase.storage
    .from('recipe-images')
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage
    .from('recipe-images')
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function deleteImage(path: string): Promise<void> {
  await supabase.storage.from('recipe-images').remove([path]);
}
