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

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    const body = await req.json();
    const { title, description, technologies, image_url, project_url, github_url, category, featured } = body;

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

    return new Response(
      JSON.stringify({ project }),
      { status: 201, headers }
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
  path: "/api/create-project"
};
