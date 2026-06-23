const { createClient } = require('@supabase/supabase-js');

let supabaseClient;

function getSupabase() {
  if (!process.env.SUPABASE_DATABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.SUPABASE_DATABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  return supabaseClient;
}

module.exports = { getSupabase };
