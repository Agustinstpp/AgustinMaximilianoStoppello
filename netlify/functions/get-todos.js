const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event) {
  const supabase = createClient(
    process.env.SUPABASE_DATABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { completed } = event.queryStringParameters || {};
  
  let query = supabase.from('todos').select('*');
  
  if (completed !== undefined) {
    query = query.eq('is_completed', completed === 'true');
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ todos: data })
  };
};
