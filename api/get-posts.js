const { getSql, handleOptions, serverError, setCors } = require('./_utils');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  try {
    const sql = getSql();
    const posts = await sql`SELECT * FROM posts ORDER BY created_at DESC`;

    return res.status(200).json({ posts });
  } catch (error) {
    return serverError(res, error);
  }
};
