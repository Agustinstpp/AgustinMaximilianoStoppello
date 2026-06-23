const { getBody, getSql, handleOptions, methodNotAllowed, serverError, setCors } = require('./_utils');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res);

  try {
    const { title, content, author } = getBody(req);

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const sql = getSql();
    const [post] = await sql`
      INSERT INTO posts (title, content, author, created_at)
      VALUES (${title}, ${content}, ${author || 'Anonymous'}, NOW())
      RETURNING *
    `;

    return res.status(201).json({ post });
  } catch (error) {
    return serverError(res, error);
  }
};
