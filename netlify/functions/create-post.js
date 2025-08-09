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
    const { title, content, author } = body;

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: 'Title and content are required' }),
        { status: 400, headers }
      );
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    const [result] = await sql`
      INSERT INTO posts (title, content, author, created_at) 
      VALUES (${title}, ${content}, ${author || 'Anonymous'}, NOW())
      RETURNING *
    `;

    return new Response(
      JSON.stringify({ post: result }),
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
  path: "/api/create-post"
};
