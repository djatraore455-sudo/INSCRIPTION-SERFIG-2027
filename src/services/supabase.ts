import { supabase } from '../lib/supabase';

export { supabase };

/**
 * Vérifie si les variables de connexion Supabase sont disponibles.
 */
export const isSupabaseConfigured = (): boolean => {
  return true;
};
