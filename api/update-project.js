const { getBody, getSql, handleOptions, methodNotAllowed, serverError, setCors } = require('./_utils');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'PUT' && req.method !== 'PATCH') return methodNotAllowed(res);

  try {
    const { id, title, description, technologies, image_url, project_url, github_url, category, featured } = getBody(req);

    if (!id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const techArray = Array.isArray(technologies)
      ? technologies
      : (technologies ? technologies.split(',').map((tech) => tech.trim()).filter(Boolean) : []);
    const featuredBool = featured === true || featured === 'true';
    const sql = getSql();

    const [project] = await sql`
      UPDATE projects
      SET
        title = ${title},
        description = ${description},
        technologies = ${techArray},
        image_url = ${image_url || null},
        project_url = ${project_url || null},
        github_url = ${github_url || null},
        category = ${category || null},
        featured = ${featuredBool}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.status(200).json({ project });
  } catch (error) {
    return serverError(res, error);
  }
};
