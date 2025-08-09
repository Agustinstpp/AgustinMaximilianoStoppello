const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event) {
  const supabase = createClient(
    process.env.SUPABASE_DATABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { id, task, is_completed } = JSON.parse(event.body);

  const updateData = {};
  if (task !== undefined) updateData.task = task;
  if (is_completed !== undefined) updateData.is_completed = is_completed;

  const { data, error } = await supabase
    .from('todos')
    .update(updateData)
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
    body: JSON.stringify({ message: 'Tarea actualizada', data })
  };
};
