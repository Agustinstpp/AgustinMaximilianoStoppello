const { getSql, handleOptions, methodNotAllowed, serverError, setCors } = require('./_utils');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res);

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const sql = getSql();
    const [project] = await sql`SELECT * FROM projects WHERE id = ${id}`;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.status(200).json({ project });
  } catch (error) {
    return serverError(res, error);
  }
};
