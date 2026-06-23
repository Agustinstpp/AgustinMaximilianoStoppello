const { getSql, handleOptions, methodNotAllowed, serverError, setCors } = require('./_utils');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res);

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    const sql = getSql();
    const [post] = await sql`SELECT * FROM posts WHERE id = ${id}`;

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.status(200).json({ post });
  } catch (error) {
    return serverError(res, error);
  }
};
