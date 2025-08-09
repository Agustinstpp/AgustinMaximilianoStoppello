require("dotenv").config();
const http = require("http");
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

const requestHandler = async (req, res) => {
  // Set CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    switch (path) {
      case '/':
      case '/version':
        const result = await sql`SELECT version()`;
        const { version } = result[0];
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ version, timestamp: new Date().toISOString() }));
        break;

      case '/health':
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: 'ok' }));
        break;

      case '/projects':
        const projects = await sql`SELECT * FROM projects ORDER BY created_at DESC`;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(projects));
        break;

      case '/todos':
        const todos = await sql`SELECT * FROM todos ORDER BY created_at DESC`;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(todos));
        break;

      default:
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: 'Not Found', path }));
    }
  } catch (error) {
    console.error('Database error:', error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: 'Internal Server Error', message: error.message }));
  }
};

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || 'localhost';

http.createServer(requestHandler).listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET / - PostgreSQL version');
  console.log('  GET /health - Health check');
  console.log('  GET /projects - List all projects');
  console.log('  GET /todos - List all todos');
});
