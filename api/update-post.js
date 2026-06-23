const { getBody, getSql, handleOptions, methodNotAllowed, serverError, setCors } = require('./_utils');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'PUT' && req.method !== 'PATCH') return methodNotAllowed(res);

  try {
    const { id, title, content, author } = getBody(req);

    if (!id) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const sql = getSql();
    const [post] = await sql`
      UPDATE posts
      SET
        title = ${title},
        content = ${content},
        author = ${author || 'Agustin Stoppello'}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.status(200).json({ post });
  } catch (error) {
    return serverError(res, error);
  }
};
