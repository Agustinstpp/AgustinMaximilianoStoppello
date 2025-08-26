require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { neon } = require('@neondatabase/serverless');

const app = express();
const sql = neon(process.env.DATABASE_URL);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await sql`SELECT 1`;
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message
    });
  }
});

// Database version endpoint
app.get('/', async (req, res) => {
  try {
    const result = await sql`SELECT version()`;
    const { version } = result[0];
    res.json({ 
      version, 
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        projects: '/api/projects',
        todos: '/api/todos'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Projects API routes
app.get('/api/projects', async (req, res) => {
  try {
    const { category, featured, limit = 10, offset = 0 } = req.query;
    let query = sql`SELECT * FROM projects`;
    
    const conditions = [];
    if (category) conditions.push(sql`category = ${category}`);
    if (featured !== undefined) conditions.push(sql`featured = ${featured === 'true'}`);
    
    if (conditions.length > 0) {
      query = sql`${query} WHERE ${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`;
    }
    
    query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const projects = await query;
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sql`SELECT * FROM projects WHERE id = ${id}`;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { title, description, technologies, image_url, project_url, github_url, category, featured } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    const result = await sql`
      INSERT INTO projects (title, description, technologies, image_url, project_url, github_url, category, featured)
      VALUES (${title}, ${description}, ${technologies || []}, ${image_url || null}, ${project_url || null}, ${github_url || null}, ${category || 'General'}, ${featured || false})
      RETURNING *
    `;
    
    res.status(201).json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, technologies, image_url, project_url, github_url, category, featured } = req.body;
    
    const result = await sql`
      UPDATE projects 
      SET 
        title = ${title}, 
        description = ${description}, 
        technologies = ${technologies}, 
        image_url = ${image_url}, 
        project_url = ${project_url}, 
        github_url = ${github_url}, 
        category = ${category}, 
        featured = ${featured},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sql`DELETE FROM projects WHERE id = ${id} RETURNING *`;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Todos API routes
app.get('/api/todos', async (req, res) => {
  try {
    const { completed, limit = 10, offset = 0 } = req.query;
    let query = sql`SELECT * FROM todos`;
    
    if (completed !== undefined) {
      query = sql`${query} WHERE is_completed = ${completed === 'true'}`;
    }
    
    query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const todos = await query;
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sql`SELECT * FROM todos WHERE id = ${id}`;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const { task, is_completed } = req.body;
    
    if (!task) {
      return res.status(400).json({ error: 'Task is required' });
    }
    
    const result = await sql`
      INSERT INTO todos (task, is_completed)
      VALUES (${task}, ${is_completed || false})
      RETURNING *
    `;
    
    res.status(201).json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { task, is_completed } = req.body;
    
    const result = await sql`
      UPDATE todos 
      SET 
        task = ${task}, 
        is_completed = ${is_completed},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sql`DELETE FROM todos WHERE id = ${id} RETURNING *`;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET / - PostgreSQL version and API info');
  console.log('  GET /health - Health check with database status');
  console.log('  GET /api/projects - List projects (with filtering)');
  console.log('  POST /api/projects - Create new project');
  console.log('  GET /api/projects/:id - Get single project');
  console.log('  PUT /api/projects/:id - Update project');
  console.log('  DELETE /api/projects/:id - Delete project');
  console.log('  GET /api/todos - List todos (with filtering)');
  console.log('  POST /api/todos - Create new todo');
  console.log('  GET /api/todos/:id - Get single todo');
  console.log('  PUT /api/todos/:id - Update todo');
  console.log('  DELETE /api/todos/:id - Delete todo');
});
