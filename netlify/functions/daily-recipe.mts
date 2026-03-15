import type { Config } from '@netlify/functions';

export default async () => {
  const supabaseUrl = Netlify.env.get('SUPABASE_URL');
  const supabaseAnonKey = Netlify.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    return new Response('Missing environment variables', { status: 500 });
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
    return new Response('Failed to fetch recipes', { status: 500 });
  }

  const recipes = await response.json();
  const recipeName = recipes[0]?.title ?? 'No recipes found';

  console.log('First recipe:', recipeName);

  return new Response(JSON.stringify({ firstRecipe: recipeName }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config: Config = {
  schedule: '@daily',
};
