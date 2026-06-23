const { neon } = require('@neondatabase/serverless');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

let sqlClient;

function setCors(res) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

function handleOptions(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
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

function getBody(req) {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }

  return req.body;
}

function methodNotAllowed(res) {
  return res.status(405).json({ error: 'Method not allowed' });
}

function serverError(res, error) {
  console.error('Database error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = {
  getBody,
  getSql,
  handleOptions,
  methodNotAllowed,
  serverError,
  setCors,
};
