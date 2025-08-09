import { neon } from '@netlify/neon';

export default async (req, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    // Get postId from URL parameters
    const url = new URL(req.url);
    const postId = url.searchParams.get('id');

    if (!postId) {
      return new Response(
        JSON.stringify({ error: 'Post ID is required' }),
        { status: 400, headers }
      );
    }

    // Initialize Neon client
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    // Query the database
    const [post] = await sql`SELECT * FROM posts WHERE id = ${postId}`;
    
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
  path: "/api/get-post"
};
