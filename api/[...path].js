const { neon } = require('@neondatabase/serverless');
const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

let sqlClient;
let supabaseClient;

function setCors(res) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not configured');
  }

  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL);
  }

  return sqlClient;
}

function getSupabase() {
  if (!process.env.SUPABASE_DATABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.SUPABASE_DATABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  return supabaseClient;
}

function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return req.body;
}

function getRoute(req) {
  const path = req.query?.path;

  if (Array.isArray(path)) {
    return path.join('/');
  }

  if (path) {
    return path;
  }

  const url = new URL(req.url, 'http://localhost');
  return url.pathname.replace(/^\/api\/?/, '');
}

function methodNotAllowed(res) {
  return res.status(405).json({ error: 'Method not allowed' });
}

function serverError(res, error) {
  console.error('API error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}

function parseTechnologyList(technologies) {
  if (Array.isArray(technologies)) return technologies;
  if (!technologies) return [];
  return technologies.split(',').map((tech) => tech.trim()).filter(Boolean);
}

async function createPost(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);

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
}

async function createProject(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  const { title, description, technologies, image_url, project_url, github_url, category, featured } = getBody(req);
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  const sql = getSql();
  const [project] = await sql`
    INSERT INTO projects (title, description, technologies, image_url, project_url, github_url, category, featured)
    VALUES (
      ${title},
      ${description},
      ${parseTechnologyList(technologies)},
      ${image_url || null},
      ${project_url || null},
      ${github_url || null},
      ${category || null},
      ${featured === true || featured === 'true'}
    )
    RETURNING *
  `;

  return res.status(201).json({ project });
}

async function deletePost(req, res) {
  if (req.method !== 'DELETE') return methodNotAllowed(res);

  const { id } = getBody(req);
  if (!id) return res.status(400).json({ error: 'Post ID is required' });

  const sql = getSql();
  const [deleted] = await sql`DELETE FROM posts WHERE id = ${id} RETURNING id, title`;

  if (!deleted) return res.status(404).json({ error: 'Post not found' });
  return res.status(200).json({ message: 'Articulo eliminado', id: deleted.id });
}

async function deleteProject(req, res) {
  if (req.method !== 'DELETE') return methodNotAllowed(res);

  const { id } = getBody(req);
  if (!id) return res.status(400).json({ error: 'Project ID is required' });

  const sql = getSql();
  const [deleted] = await sql`DELETE FROM projects WHERE id = ${id} RETURNING id, title`;

  if (!deleted) return res.status(404).json({ error: 'Project not found' });
  return res.status(200).json({ message: 'Proyecto eliminado', id: deleted.id });
}

async function getPost(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res);

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Post ID is required' });

  const sql = getSql();
  const [post] = await sql`SELECT * FROM posts WHERE id = ${id}`;

  if (!post) return res.status(404).json({ error: 'Post not found' });
  return res.status(200).json({ post });
}

async function getPosts(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res);

  const sql = getSql();
  const posts = await sql`SELECT * FROM posts ORDER BY created_at DESC`;
  return res.status(200).json({ posts });
}

async function getProject(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res);

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Project ID is required' });

  const sql = getSql();
  const [project] = await sql`SELECT * FROM projects WHERE id = ${id}`;

  if (!project) return res.status(404).json({ error: 'Project not found' });
  return res.status(200).json({ project });
}

async function getProjects(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res);

  const sql = getSql();
  const projects = await sql`SELECT * FROM projects ORDER BY created_at DESC`;
  return res.status(200).json({ projects });
}

async function addTodo(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  const { task } = getBody(req);
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('todos')
    .insert([{ task, is_completed: false }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ message: 'Tarea agregada', data });
}

async function deleteTodo(req, res) {
  if (req.method !== 'DELETE') return methodNotAllowed(res);

  const { id } = getBody(req);
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ message: 'Tarea eliminada', data });
}

async function getTodos(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res);

  const { completed } = req.query || {};
  const supabase = getSupabase();
  let query = supabase.from('todos').select('*');

  if (completed !== undefined) {
    query = query.eq('is_completed', completed === 'true');
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ todos: data });
}

async function updatePost(req, res) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') return methodNotAllowed(res);

  const { id, title, content, author } = getBody(req);
  if (!id) return res.status(400).json({ error: 'Post ID is required' });
  if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

  const sql = getSql();
  const [post] = await sql`
    UPDATE posts
    SET
      title = ${title},
      content = ${content},
      author = ${author || 'Agustin Stoppello'}
    WHERE id = ${id}
    RETURNING *
  `;

  if (!post) return res.status(404).json({ error: 'Post not found' });
  return res.status(200).json({ post });
}

async function updateProject(req, res) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') return methodNotAllowed(res);

  const { id, title, description, technologies, image_url, project_url, github_url, category, featured } = getBody(req);
  if (!id) return res.status(400).json({ error: 'Project ID is required' });
  if (!title || !description) return res.status(400).json({ error: 'Title and description are required' });

  const sql = getSql();
  const [project] = await sql`
    UPDATE projects
    SET
      title = ${title},
      description = ${description},
      technologies = ${parseTechnologyList(technologies)},
      image_url = ${image_url || null},
      project_url = ${project_url || null},
      github_url = ${github_url || null},
      category = ${category || null},
      featured = ${featured === true || featured === 'true'}
    WHERE id = ${id}
    RETURNING *
  `;

  if (!project) return res.status(404).json({ error: 'Project not found' });
  return res.status(200).json({ project });
}

async function updateTodo(req, res) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') return methodNotAllowed(res);

  const { id, task, is_completed } = getBody(req);
  const updateData = {};
  if (task !== undefined) updateData.task = task;
  if (is_completed !== undefined) updateData.is_completed = is_completed;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('todos')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ message: 'Tarea actualizada', data });
}

const routes = {
  'add-todo': addTodo,
  'create-post': createPost,
  'create-project': createProject,
  'delete-post': deletePost,
  'delete-project': deleteProject,
  'delete-todo': deleteTodo,
  'get-post': getPost,
  'get-posts': getPosts,
  'get-project': getProject,
  'get-projects': getProjects,
  'get-todos': getTodos,
  'update-post': updatePost,
  'update-project': updateProject,
  'update-todo': updateTodo,
};

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const route = getRoute(req);
    const routeHandler = routes[route];

    if (!routeHandler) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }

    return routeHandler(req, res);
  } catch (error) {
    return serverError(res, error);
  }
};
