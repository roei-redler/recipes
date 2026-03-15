import type { Config } from '@netlify/functions';

export default async (req: Request) => {
  const { next_run } = await req.json();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    return;
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/recipes?select=title&order=created_at.asc&limit=1`,
    {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    },
  );

  if (!response.ok) {
    console.error('Supabase request failed:', response.statusText);
    return;
  }

  const recipes = await response.json();
  const recipeName = recipes[0]?.title ?? 'No recipes found';

  console.log('First recipe:', recipeName);
  console.log('Next invocation at:', next_run);
};

export const config: Config = {
  schedule: '@daily',
};
