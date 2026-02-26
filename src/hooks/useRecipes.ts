import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, uploadImage } from '../lib/supabase';
import { hashPassword } from '../lib/utils';
import type { Recipe, RecipeFilters, RecipeFormData } from '../lib/types';

// ── Data fetchers ──────────────────────────────────────────────────────────

async function fetchRecipesList(filters: RecipeFilters): Promise<Recipe[]> {
  let query = supabase
    .from('recipes')
    .select(`
      *,
      ingredients(*),
      steps:recipe_steps(*),
      tags:recipe_tags(tag:tags(*))
    `);

  if (filters.search.trim()) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  if (filters.max_cook_time !== null) {
    query = query.lte('cook_time', filters.max_cook_time);
  }

  if (filters.sort === 'alpha') {
    query = query.order('title', { ascending: true });
  } else if (filters.sort === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let result = (data ?? []).map((r: any) => ({
    ...r,
    tags: (r.tags ?? []).map((rt: any) => rt.tag).filter(Boolean),
  })) as Recipe[];

  if (filters.tag_ids.length > 0) {
    result = result.filter((r) =>
      filters.tag_ids.every((tid) => r.tags?.some((t) => t.id === tid))
    );
  }

  return result;
}

async function fetchRecipeById(id: string): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      ingredients(*),
      steps:recipe_steps(*),
      tags:recipe_tags(tag:tags(*))
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    tags: (data.tags ?? []).map((rt: any) => rt.tag).filter(Boolean),
    ingredients: (data.ingredients ?? []).sort((a: any, b: any) => a.order_index - b.order_index),
    steps: (data.steps ?? []).sort((a: any, b: any) => a.order_index - b.order_index),
  } as Recipe;
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useRecipes(filters: RecipeFilters) {
  const { data: recipes = [], isLoading: loading, error: err, refetch } = useQuery({
    queryKey: ['recipes', filters],
    queryFn: () => fetchRecipesList(filters),
  });
  return { recipes, loading, error: err ? (err as Error).message : null, refetch };
}

export function useRecipe(id: string | undefined) {
  const { data: recipe = null, isLoading: loading, error: err, refetch } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => fetchRecipeById(id!),
    enabled: !!id,
  });
  return { recipe, loading, error: err ? (err as Error).message : null, refetch };
}

export function useSaveRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      formData,
      coverImageFile,
      existingId,
    }: {
      formData: RecipeFormData;
      coverImageFile: File | null;
      existingId?: string;
    }) => saveRecipe(formData, coverImageFile, existingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

// ── Core async operations (also exported for direct use) ───────────────────

export async function saveRecipe(
  formData: RecipeFormData,
  coverImageFile: File | null,
  existingId?: string
): Promise<{ id: string }> {
  let image_url = formData.image_url;

  if (coverImageFile) {
    const ext = coverImageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `covers/${Date.now()}.${ext}`;
    image_url = await uploadImage(coverImageFile, path);
  }

  // Compute lock_password hash
  let lock_password = formData.lock_password; // keep existing by default
  if (formData.removeLock) {
    lock_password = null;
  } else if (formData.newLockPassword) {
    lock_password = await hashPassword(formData.newLockPassword);
  }

  const recipePayload = {
    title: formData.title,
    description: formData.description || null,
    servings: formData.servings !== '' ? Number(formData.servings) : null,
    prep_time: formData.prep_time !== '' ? Number(formData.prep_time) : null,
    cook_time: formData.cook_time !== '' ? Number(formData.cook_time) : null,
    image_url,
    lock_password,
  };

  let recipeId = existingId;

  if (existingId) {
    const { error } = await supabase.from('recipes').update(recipePayload).eq('id', existingId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('recipes')
      .insert(recipePayload)
      .select('id')
      .single();
    if (error) throw error;
    recipeId = data.id;
  }

  if (!recipeId) throw new Error('Recipe ID missing');

  // Replace ingredients
  await supabase.from('ingredients').delete().eq('recipe_id', recipeId);
  if (formData.ingredients.length > 0) {
    const { error } = await supabase.from('ingredients').insert(
      formData.ingredients.map((ing, i) => ({
        recipe_id: recipeId,
        name: ing.name,
        quantity: ing.quantity !== '' ? Number(ing.quantity) : null,
        unit: ing.unit,
        order_index: i,
      }))
    );
    if (error) throw error;
  }

  // Replace steps
  await supabase.from('recipe_steps').delete().eq('recipe_id', recipeId);
  if (formData.steps.length > 0) {
    const stepsWithImages = await Promise.all(
      formData.steps.map(async (step, i) => {
        let stepImageUrl = step.image_url;
        if (step.imageFile) {
          const ext = step.imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
          const path = `steps/${recipeId}/${Date.now()}-${i}.${ext}`;
          stepImageUrl = await uploadImage(step.imageFile, path);
        }
        return {
          recipe_id: recipeId,
          description: step.description,
          image_url: stepImageUrl,
          order_index: i,
          duration: step.duration !== '' ? Number(step.duration) : null,
        };
      })
    );
    const { error } = await supabase.from('recipe_steps').insert(stepsWithImages);
    if (error) throw error;
  }

  // Replace tags
  await supabase.from('recipe_tags').delete().eq('recipe_id', recipeId);
  if (formData.tag_ids.length > 0) {
    const { error } = await supabase.from('recipe_tags').insert(
      formData.tag_ids.map((tag_id) => ({ recipe_id: recipeId, tag_id }))
    );
    if (error) throw error;
  }

  return { id: recipeId };
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}

export async function duplicateRecipe(sourceId: string, newTitle: string): Promise<{ id: string }> {
  // Fetch full source recipe
  const { data, error: fetchErr } = await supabase
    .from('recipes')
    .select(`*, ingredients(*), steps:recipe_steps(*), tags:recipe_tags(tag_id)`)
    .eq('id', sourceId)
    .single();
  if (fetchErr) throw fetchErr;

  // Insert new recipe (no lock)
  const { data: newRecipe, error: insertErr } = await supabase
    .from('recipes')
    .insert({
      title: newTitle,
      description: data.description,
      servings: data.servings,
      prep_time: data.prep_time,
      cook_time: data.cook_time,
      image_url: data.image_url,
      lock_password: null,
    })
    .select('id')
    .single();
  if (insertErr) throw insertErr;

  const newId = newRecipe.id;

  // Copy ingredients
  const ingredients = (data.ingredients ?? []).sort((a: any, b: any) => a.order_index - b.order_index);
  if (ingredients.length > 0) {
    const { error } = await supabase.from('ingredients').insert(
      ingredients.map((ing: any, i: number) => ({
        recipe_id: newId,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        order_index: i,
      }))
    );
    if (error) throw error;
  }

  // Copy steps
  const steps = (data.steps ?? []).sort((a: any, b: any) => a.order_index - b.order_index);
  if (steps.length > 0) {
    const { error } = await supabase.from('recipe_steps').insert(
      steps.map((step: any, i: number) => ({
        recipe_id: newId,
        description: step.description,
        image_url: step.image_url,
        order_index: i,
        duration: step.duration,
      }))
    );
    if (error) throw error;
  }

  // Copy tags
  const tagIds = (data.tags ?? []).map((t: any) => t.tag_id);
  if (tagIds.length > 0) {
    const { error } = await supabase.from('recipe_tags').insert(
      tagIds.map((tag_id: string) => ({ recipe_id: newId, tag_id }))
    );
    if (error) throw error;
  }

  return { id: newId };
}
