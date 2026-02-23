import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Tag } from '../lib/types';

async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from('tags').select('*').order('name');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useTags() {
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading: loading, error: err } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  const createTagMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from('tags')
        .insert({ name: name.trim(), color })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Tag;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', tagId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });

  const createTag = async (name: string, color: string): Promise<Tag | null> => {
    try {
      return await createTagMutation.mutateAsync({ name, color });
    } catch {
      return null;
    }
  };

  const deleteTag = async (tagId: string): Promise<boolean> => {
    try {
      await deleteTagMutation.mutateAsync(tagId);
      return true;
    } catch {
      return false;
    }
  };

  return {
    tags,
    loading,
    error: err ? (err as Error).message : null,
    createTag,
    deleteTag,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  };
}
