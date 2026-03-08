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
    const { id, title, content, author } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Post ID is required' }),
        { status: 400, headers }
      );
    }

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: 'Title and content are required' }),
        { status: 400, headers }
      );
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    const [post] = await sql`
      UPDATE posts
      SET
        title   = ${title},
        content = ${content},
        author  = ${author || 'Agustín Stoppello'}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!post) {
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        { status: 404, headers }
      );
    }

    return new Response(
      JSON.stringify({ post }),
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
  path: "/api/update-post"
};
