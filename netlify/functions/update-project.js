import { neon } from '@netlify/neon';

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    const body = await req.json();
    const { id, title, description, technologies, image_url, project_url, github_url, category, featured } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Project ID is required' }),
        { status: 400, headers }
      );
    }

    if (!title || !description) {
      return new Response(
        JSON.stringify({ error: 'Title and description are required' }),
        { status: 400, headers }
      );
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    const techArray = Array.isArray(technologies)
      ? technologies
      : (technologies ? technologies.split(',').map(t => t.trim()).filter(Boolean) : []);

    const featuredBool = featured === true || featured === 'true';

    const [project] = await sql`
      UPDATE projects
      SET
        title        = ${title},
        description  = ${description},
        technologies = ${techArray},
        image_url    = ${image_url || null},
        project_url  = ${project_url || null},
        github_url   = ${github_url || null},
        category     = ${category || null},
        featured     = ${featuredBool}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers }
      );
    }

    return new Response(
      JSON.stringify({ project }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Database error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers }
    );
  }
};

export const config = {
  path: "/api/update-project"
};
