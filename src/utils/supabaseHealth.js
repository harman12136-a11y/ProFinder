import { supabase, isSupabaseConfigured } from '../lib/supabase';

const REQUIRED_TABLES = [
  'software_listings',
  'jobs',
  'services',
  'messages',
];

export async function checkSupabaseHealth() {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      tablesReady: false,
      missingTables: REQUIRED_TABLES,
      message: 'Supabase keys are missing from .env',
    };
  }

  const missingTables = [];
  await Promise.all(
    REQUIRED_TABLES.map(async (table) => {
      const { error } = await supabase.from(table).select('id', { head: true, count: 'exact' });
      if (error?.message?.includes('Could not find the table')) {
        missingTables.push(table);
      }
    }),
  );

  const { error: profileError } = await supabase.from('profiles').select('id', { head: true, count: 'exact' });
  if (profileError?.message?.includes('Could not find the table')) {
    missingTables.push('profiles');
  }

  const tablesReady = missingTables.length === 0;

  return {
    configured: true,
    connected: !profileError || tablesReady,
    tablesReady,
    missingTables,
    message: tablesReady
      ? 'Supabase is connected and database tables are ready.'
      : `Database setup incomplete. Run supabase/schema.sql in Supabase SQL Editor. Missing: ${missingTables.join(', ')}`,
  };
}
