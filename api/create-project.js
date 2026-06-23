const { getBody, getSql, handleOptions, methodNotAllowed, serverError, setCors } = require('./_utils');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res);

  try {
    const { title, description, technologies, image_url, project_url, github_url, category, featured } = getBody(req);

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const techArray = Array.isArray(technologies)
      ? technologies
      : (technologies ? technologies.split(',').map((tech) => tech.trim()).filter(Boolean) : []);
    const featuredBool = featured === true || featured === 'true';
    const sql = getSql();

    const [project] = await sql`
      INSERT INTO projects (title, description, technologies, image_url, project_url, github_url, category, featured)
      VALUES (
        ${title},
        ${description},
        ${techArray},
        ${image_url || null},
        ${project_url || null},
        ${github_url || null},
        ${category || null},
        ${featuredBool}
      )
      RETURNING *
    `;

    return res.status(201).json({ project });
  } catch (error) {
    return serverError(res, error);
  }
};
