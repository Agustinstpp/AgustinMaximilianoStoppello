const { handleOptions, serverError, setCors } = require('./_utils');
const { getSupabase } = require('./_supabase');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  try {
    const { completed } = req.query || {};
    const supabase = getSupabase();
    let query = supabase.from('todos').select('*');

    if (completed !== undefined) {
      query = query.eq('is_completed', completed === 'true');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ todos: data });
  } catch (error) {
    return serverError(res, error);
  }
};
