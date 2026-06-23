const { getSql, handleOptions, serverError, setCors } = require('./_utils');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  try {
    const sql = getSql();
    const projects = await sql`SELECT * FROM projects ORDER BY created_at DESC`;

    return res.status(200).json({ projects });
  } catch (error) {
    return serverError(res, error);
  }
};
