const { getBody, getSql, handleOptions, methodNotAllowed, serverError, setCors } = require('./_utils');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'DELETE') return methodNotAllowed(res);

  try {
    const { id } = getBody(req);

    if (!id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const sql = getSql();
    const [deleted] = await sql`DELETE FROM projects WHERE id = ${id} RETURNING id, title`;

    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.status(200).json({ message: 'Proyecto eliminado', id: deleted.id });
  } catch (error) {
    return serverError(res, error);
  }
};
