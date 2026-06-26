import { supabase } from './supabase';

/**
 * Fetch all money sources for the logged-in user (RLS filters by user).
 */
export async function fetchSources() {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to load sources: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Create a new money source for the logged-in user.
 */
export async function createSource({ userId, name }) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Source name cannot be empty.');
  }

  const { data, error } = await supabase
    .from('sources')
    .insert({ user_id: userId, name: trimmed })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Source "${trimmed}" already exists.`);
    }
    throw new Error(`Failed to create source: ${error.message}`);
  }

  return data;
}

/**
 * Delete a money source. Linked transactions keep source_id = null.
 */
export async function deleteSource(sourceId) {
  const { error } = await supabase.from('sources').delete().eq('id', sourceId);

  if (error) {
    throw new Error(`Failed to delete source: ${error.message}`);
  }
}
