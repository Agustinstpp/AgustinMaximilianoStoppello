const { getBody, handleOptions, methodNotAllowed, serverError, setCors } = require('./_utils');
const { getSupabase } = require('./_supabase');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'PUT' && req.method !== 'PATCH') return methodNotAllowed(res);

  try {
    const { id, task, is_completed } = getBody(req);
    const updateData = {};

    if (task !== undefined) updateData.task = task;
    if (is_completed !== undefined) updateData.is_completed = is_completed;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Tarea actualizada', data });
  } catch (error) {
    return serverError(res, error);
  }
};
