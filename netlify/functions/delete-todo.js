const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event) {
  const supabase = createClient(
    process.env.SUPABASE_DATABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { id } = JSON.parse(event.body);

  const { data, error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)
    .select();

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Tarea eliminada', data })
  };
};
