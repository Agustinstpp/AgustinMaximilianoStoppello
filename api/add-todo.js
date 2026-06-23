const { getBody, handleOptions, methodNotAllowed, serverError, setCors } = require('./_utils');
const { getSupabase } = require('./_supabase');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res);

  try {
    const { task } = getBody(req);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('todos')
      .insert([{ task, is_completed: false }])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Tarea agregada', data });
  } catch (error) {
    return serverError(res, error);
  }
};
