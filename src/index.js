const APP_VERSION = '2.13.0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}

function methodNotAllowed() {
  return jsonResponse({ error: 'Method not allowed' }, 405);
}

async function readJsonBody(request) {
  try {
    const text = await request.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function parseTechnologiesInput(technologies) {
  if (Array.isArray(technologies)) {
    return technologies.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof technologies === 'string') {
    const trimmed = technologies.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((t) => String(t).trim()).filter(Boolean);
    } catch {
      // Fallback to comma-separated list
    }
    return trimmed
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function formatProject(row) {
  if (!row) return null;
  return {
    ...row,
    technologies: parseTechnologiesInput(row.technologies),
    featured: Boolean(row.featured),
    is_visible: row.is_visible !== 0,
  };
}

function formatPost(row) {
  if (!row) return null;
  return {
    ...row,
    tags: parseTechnologiesInput(row.tags),
    is_visible: row.is_visible !== 0,
  };
}

function formatTodo(row) {
  if (!row) return null;
  return {
    ...row,
    is_completed: Boolean(row.is_completed),
  };
}

// ─── Health & Version Fingerprint ─────────────────────────────────────────────

async function handleVersion(env) {
  try {
    const row = await env.DB.prepare(
      `SELECT
         (SELECT COALESCE(MAX(updated_at), '') || ':' || COUNT(*) FROM projects WHERE is_visible = 1) AS p,
         (SELECT COALESCE(MAX(updated_at), '') || ':' || COUNT(*) FROM posts WHERE is_visible = 1) AS b,
         (SELECT COALESCE(MAX(updated_at), '') || ':' || COUNT(*) FROM brand_works) AS w`
    ).first();

    const fingerprint = `${APP_VERSION}|${row?.p || ''}|${row?.b || ''}|${row?.w || ''}`;
    return new Response(
      JSON.stringify({
        appVersion: APP_VERSION,
        fingerprint,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          ...CORS_HEADERS,
        },
      }
    );
  } catch (error) {
    return jsonResponse({ appVersion: APP_VERSION, fingerprint: APP_VERSION, error: error.message }, 200);
  }
}

async function handleHealth(env) {
  try {
    await env.DB.prepare('SELECT 1 AS ok').first();
    return jsonResponse({
      status: 'ok',
      database: 'connected',
      engine: 'cloudflare-d1',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return jsonResponse(
      {
        status: 'error',
        database: 'disconnected',
        error: error.message,
      },
      500
    );
  }
}

// ─── Projects Handlers ────────────────────────────────────────────────────────

async function getProjects(url, env, restFormat = false) {
  const category = url.searchParams.get('category');
  const featured = url.searchParams.get('featured');
  const includeHidden = url.searchParams.get('include_hidden') === 'true';
  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');

  const conditions = [];
  const params = [];

  if (!includeHidden) {
    conditions.push('is_visible = 1');
  }
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (featured !== null && featured !== undefined && featured !== '') {
    conditions.push('featured = ?');
    params.push(featured === 'true' || featured === '1' ? 1 : 0);
  }

  let query = 'SELECT * FROM projects';
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  query += ' ORDER BY created_at DESC, id DESC';

  if (limitParam) {
    const limit = Math.max(1, Math.min(100, parseInt(limitParam, 10) || 10));
    const offset = Math.max(0, parseInt(offsetParam, 10) || 0);
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
  }

  const { results } = await env.DB.prepare(query).bind(...params).all();
  const projects = results.map(formatProject);
  return jsonResponse(restFormat ? projects : { projects });
}

async function getProject(id, env, restFormat = false) {
  if (!id) return jsonResponse({ error: 'Project ID is required' }, 400);
  const row = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
  if (!row) return jsonResponse({ error: 'Project not found' }, 404);
  const project = formatProject(row);
  return jsonResponse(restFormat ? project : { project });
}

async function createProject(request, env, restFormat = false) {
  const body = await readJsonBody(request);
  const {
    title,
    description,
    content,
    technologies,
    image_url,
    project_url,
    demo_url,
    github_url,
    category,
    featured,
  } = body;

  if (!title || !description) {
    return jsonResponse({ error: 'Title and description are required' }, 400);
  }

  const techJson = JSON.stringify(parseTechnologiesInput(technologies));
  const isFeatured = featured === true || featured === 'true' || featured === 1 ? 1 : 0;
  const isVisible = body.is_visible === false || body.is_visible === 'false' || body.is_visible === 0 ? 0 : 1;

  const row = await env.DB.prepare(
    `INSERT INTO projects (title, description, content, technologies, image_url, project_url, demo_url, github_url, category, featured, is_visible)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`
  )
    .bind(
      title,
      description,
      content || null,
      techJson,
      image_url || null,
      project_url || null,
      demo_url || null,
      github_url || null,
      category || null,
      isFeatured,
      isVisible
    )
    .first();

  const project = formatProject(row);
  return jsonResponse(restFormat ? project : { project }, 201);
}

async function updateProject(request, env, paramId = null, restFormat = false) {
  const body = await readJsonBody(request);
  const id = paramId || body.id;
  const {
    title,
    description,
    content,
    technologies,
    image_url,
    project_url,
    demo_url,
    github_url,
    category,
    featured,
  } = body;

  if (!id) return jsonResponse({ error: 'Project ID is required' }, 400);
  if (!title || !description) {
    return jsonResponse({ error: 'Title and description are required' }, 400);
  }

  const techJson = JSON.stringify(parseTechnologiesInput(technologies));
  const isFeatured = featured === true || featured === 'true' || featured === 1 ? 1 : 0;
  const isVisible = body.is_visible === false || body.is_visible === 'false' || body.is_visible === 0 ? 0 : 1;

  const row = await env.DB.prepare(
    `UPDATE projects
     SET title = ?,
         description = ?,
         content = ?,
         technologies = ?,
         image_url = ?,
         project_url = ?,
         demo_url = ?,
         github_url = ?,
         category = ?,
         featured = ?,
         is_visible = ?,
         updated_at = datetime('now')
     WHERE id = ?
     RETURNING *`
  )
    .bind(
      title,
      description,
      content || null,
      techJson,
      image_url || null,
      project_url || null,
      demo_url || null,
      github_url || null,
      category || null,
      isFeatured,
      isVisible,
      id
    )
    .first();

  if (!row) return jsonResponse({ error: 'Project not found' }, 404);
  const project = formatProject(row);
  return jsonResponse(restFormat ? project : { project });
}

async function deleteProject(request, env, paramId = null) {
  const body = paramId ? {} : await readJsonBody(request);
  const id = paramId || body.id;
  if (!id) return jsonResponse({ error: 'Project ID is required' }, 400);

  const deleted = await env.DB.prepare('DELETE FROM projects WHERE id = ? RETURNING id, title')
    .bind(id)
    .first();

  if (!deleted) return jsonResponse({ error: 'Project not found' }, 404);
  return jsonResponse({ message: 'Proyecto eliminado', id: deleted.id });
}

async function toggleProjectVisibility(request, env) {
  const { id, is_visible } = await readJsonBody(request);
  if (!id) return jsonResponse({ error: 'Project ID is required' }, 400);
  const vis = is_visible === false || is_visible === 'false' || is_visible === 0 ? 0 : 1;
  const row = await env.DB.prepare(
    `UPDATE projects SET is_visible = ?, updated_at = datetime('now') WHERE id = ? RETURNING *`
  )
    .bind(vis, id)
    .first();
  if (!row) return jsonResponse({ error: 'Project not found' }, 404);
  return jsonResponse({ project: formatProject(row) });
}

// ─── Posts Handlers ───────────────────────────────────────────────────────────

async function getPosts(url, env, restFormat = false) {
  const includeHidden = url.searchParams.get('include_hidden') === 'true';
  const query = includeHidden
    ? 'SELECT * FROM posts ORDER BY created_at DESC, id DESC'
    : 'SELECT * FROM posts WHERE is_visible = 1 ORDER BY created_at DESC, id DESC';
  const { results } = await env.DB.prepare(query).all();
  const posts = results.map(formatPost);
  return jsonResponse(restFormat ? posts : { posts });
}

async function getPost(id, env, restFormat = false) {
  if (!id) return jsonResponse({ error: 'Post ID is required' }, 400);
  const row = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
  if (!row) return jsonResponse({ error: 'Post not found' }, 404);
  const post = formatPost(row);
  return jsonResponse(restFormat ? post : { post });
}

async function createPost(request, env, restFormat = false) {
  const body = await readJsonBody(request);
  const { title, content, author, summary, cover_url, tags } = body;
  if (!title || !content) {
    return jsonResponse({ error: 'Title and content are required' }, 400);
  }

  const tagsJson = JSON.stringify(parseTechnologiesInput(tags));
  const isVisible = body.is_visible === false || body.is_visible === 'false' || body.is_visible === 0 ? 0 : 1;
  const row = await env.DB.prepare(
    `INSERT INTO posts (title, content, author, summary, cover_url, tags, is_visible)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     RETURNING *`
  )
    .bind(title, content, author || 'Agustín Stoppello', summary || null, cover_url || null, tagsJson, isVisible)
    .first();

  const post = formatPost(row);
  return jsonResponse(restFormat ? post : { post }, 201);
}

async function updatePost(request, env, paramId = null, restFormat = false) {
  const body = await readJsonBody(request);
  const id = paramId || body.id;
  const { title, content, author, summary, cover_url, tags } = body;

  if (!id) return jsonResponse({ error: 'Post ID is required' }, 400);
  if (!title || !content) {
    return jsonResponse({ error: 'Title and content are required' }, 400);
  }

  const tagsJson = JSON.stringify(parseTechnologiesInput(tags));
  const isVisible = body.is_visible === false || body.is_visible === 'false' || body.is_visible === 0 ? 0 : 1;
  const row = await env.DB.prepare(
    `UPDATE posts
     SET title = ?,
         content = ?,
         author = ?,
         summary = ?,
         cover_url = ?,
         tags = ?,
         is_visible = ?,
         updated_at = datetime('now')
     WHERE id = ?
     RETURNING *`
  )
    .bind(
      title,
      content,
      author || 'Agustín Stoppello',
      summary || null,
      cover_url || null,
      tagsJson,
      isVisible,
      id
    )
    .first();

  if (!row) return jsonResponse({ error: 'Post not found' }, 404);
  const post = formatPost(row);
  return jsonResponse(restFormat ? post : { post });
}

async function togglePostVisibility(request, env) {
  const { id, is_visible } = await readJsonBody(request);
  if (!id) return jsonResponse({ error: 'Post ID is required' }, 400);
  const vis = is_visible === false || is_visible === 'false' || is_visible === 0 ? 0 : 1;
  const row = await env.DB.prepare(
    `UPDATE posts SET is_visible = ?, updated_at = datetime('now') WHERE id = ? RETURNING *`
  )
    .bind(vis, id)
    .first();
  if (!row) return jsonResponse({ error: 'Post not found' }, 404);
  return jsonResponse({ post: formatPost(row) });
}

async function deletePost(request, env, paramId = null) {
  const body = paramId ? {} : await readJsonBody(request);
  const id = paramId || body.id;
  if (!id) return jsonResponse({ error: 'Post ID is required' }, 400);

  const deleted = await env.DB.prepare('DELETE FROM posts WHERE id = ? RETURNING id, title')
    .bind(id)
    .first();

  if (!deleted) return jsonResponse({ error: 'Post not found' }, 404);
  return jsonResponse({ message: 'Articulo eliminado', id: deleted.id });
}

// ─── Todos Handlers ───────────────────────────────────────────────────────────

async function getTodos(url, env, restFormat = false) {
  const completed = url.searchParams.get('completed');
  let query = 'SELECT * FROM todos';
  const params = [];

  if (completed !== null && completed !== undefined && completed !== '') {
    query += ' WHERE is_completed = ?';
    params.push(completed === 'true' || completed === '1' ? 1 : 0);
  }

  query += ' ORDER BY created_at DESC, id DESC';
  const { results } = await env.DB.prepare(query).bind(...params).all();
  const todos = results.map(formatTodo);
  return jsonResponse(restFormat ? todos : { todos });
}

async function getTodo(id, env) {
  if (!id) return jsonResponse({ error: 'Todo ID is required' }, 400);
  const row = await env.DB.prepare('SELECT * FROM todos WHERE id = ?').bind(id).first();
  if (!row) return jsonResponse({ error: 'Todo not found' }, 404);
  return jsonResponse(formatTodo(row));
}

async function createTodo(request, env, restFormat = false) {
  const { task, is_completed } = await readJsonBody(request);
  if (!task) return jsonResponse({ error: 'Task is required' }, 400);

  const row = await env.DB.prepare(
    `INSERT INTO todos (task, is_completed)
     VALUES (?, ?)
     RETURNING *`
  )
    .bind(task, is_completed ? 1 : 0)
    .first();

  const todo = formatTodo(row);
  if (restFormat) return jsonResponse(todo, 201);
  return jsonResponse({ message: 'Tarea agregada', data: [todo] });
}

async function updateTodo(request, env, paramId = null, restFormat = false) {
  const body = await readJsonBody(request);
  const id = paramId || body.id;
  if (!id) return jsonResponse({ error: 'Todo ID is required' }, 400);

  const existing = await env.DB.prepare('SELECT * FROM todos WHERE id = ?').bind(id).first();
  if (!existing) return jsonResponse({ error: 'Todo not found' }, 404);

  const nextTask = body.task !== undefined ? body.task : existing.task;
  const nextCompleted =
    body.is_completed !== undefined ? (body.is_completed ? 1 : 0) : existing.is_completed;

  const row = await env.DB.prepare(
    `UPDATE todos
     SET task = ?,
         is_completed = ?,
         updated_at = datetime('now')
     WHERE id = ?
     RETURNING *`
  )
    .bind(nextTask, nextCompleted, id)
    .first();

  const todo = formatTodo(row);
  if (restFormat) return jsonResponse(todo);
  return jsonResponse({ message: 'Tarea actualizada', data: [todo] });
}

async function deleteTodo(request, env, paramId = null, restFormat = false) {
  const body = paramId ? {} : await readJsonBody(request);
  const id = paramId || body.id;
  if (!id) return jsonResponse({ error: 'Todo ID is required' }, 400);

  const deleted = await env.DB.prepare('DELETE FROM todos WHERE id = ? RETURNING *')
    .bind(id)
    .first();

  if (!deleted) return jsonResponse({ error: 'Todo not found' }, 404);
  if (restFormat) return jsonResponse({ message: 'Todo deleted successfully' });
  return jsonResponse({ message: 'Tarea eliminada', data: [formatTodo(deleted)] });
}

// ─── Brand Works Handlers ─────────────────────────────────────────────────────

async function getBrandWorks(url, env) {
  const brand = url.searchParams.get('brand');
  let query = 'SELECT * FROM brand_works';
  const params = [];

  if (brand) {
    query += ' WHERE brand = ?';
    params.push(brand);
  }
  query += ' ORDER BY id ASC';

  const { results } = await env.DB.prepare(query).bind(...params).all();
  return jsonResponse({ works: results });
}

async function createBrandWork(request, env) {
  const { brand, tag, title, description, url } = await readJsonBody(request);
  if (!brand || !title || !description) {
    return jsonResponse({ error: 'Brand, title and description are required' }, 400);
  }

  const work = await env.DB.prepare(
    `INSERT INTO brand_works (brand, tag, title, description, url)
     VALUES (?, ?, ?, ?, ?)
     RETURNING *`
  )
    .bind(brand, tag || 'DISEÑO · DESARROLLO', title, description, url || null)
    .first();

  return jsonResponse({ work }, 201);
}

async function updateBrandWork(request, env) {
  const { id, brand, tag, title, description, url } = await readJsonBody(request);
  if (!id) return jsonResponse({ error: 'Work ID is required' }, 400);
  if (!brand || !title || !description) {
    return jsonResponse({ error: 'Brand, title and description are required' }, 400);
  }

  const work = await env.DB.prepare(
    `UPDATE brand_works
     SET brand = ?,
         tag = ?,
         title = ?,
         description = ?,
         url = ?,
         updated_at = datetime('now')
     WHERE id = ?
     RETURNING *`
  )
    .bind(brand, tag || 'DISEÑO · DESARROLLO', title, description, url || null, id)
    .first();

  if (!work) return jsonResponse({ error: 'Work not found' }, 404);
  return jsonResponse({ work });
}

async function deleteBrandWork(request, env) {
  const { id } = await readJsonBody(request);
  if (!id) return jsonResponse({ error: 'Work ID is required' }, 400);

  const deleted = await env.DB.prepare('DELETE FROM brand_works WHERE id = ? RETURNING id, title')
    .bind(id)
    .first();

  if (!deleted) return jsonResponse({ error: 'Work not found' }, 404);
  return jsonResponse({ message: 'Trabajo eliminado', id: deleted.id });
}

// ─── R2 Media Upload & Serving ────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

async function uploadImageToR2(request, env) {
  if (!env.MEDIA) {
    return jsonResponse({ error: 'R2 MEDIA bucket is not configured' }, 500);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ error: 'Invalid multipart/form-data body' }, 400);
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return jsonResponse({ error: 'Missing image file field' }, 400);
  }

  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    return jsonResponse(
      { error: 'Formato no soportado. Usá JPG, PNG, WebP, GIF o SVG.' },
      400
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return jsonResponse({ error: 'La imagen supera el límite de 10 MB.' }, 413);
  }

  const rand = crypto.randomUUID().slice(0, 8);
  const key = `uploads/${Date.now()}-${rand}.${ext}`;

  await env.MEDIA.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });

  return jsonResponse({ url: `/media/${key}`, key }, 201);
}

async function serveMediaFromR2(url, env) {
  if (!env.MEDIA) {
    return new Response('Media bucket not configured', { status: 500 });
  }

  const key = decodeURIComponent(url.pathname.replace(/^\/media\//, ''));
  if (!key || key.includes('..')) {
    return new Response('Invalid media key', { status: 400 });
  }

  const object = await env.MEDIA.get(key);
  if (!object) {
    return new Response('Media not found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  if (!headers.has('cache-control')) {
    headers.set('cache-control', 'public, max-age=31536000, immutable');
  }

  return new Response(object.body, { headers });
}

// ─── Analytics Handlers (D1) ──────────────────────────────────────────────────

const ALLOWED_EVENT_TYPES = new Set(['pageview', 'click', 'section_view', 'duration']);

function cleanStr(val, maxLen = 140) {
  if (val === null || val === undefined) return '';
  return String(val).trim().slice(0, maxLen);
}

async function trackAnalytics(request, env) {
  const body = await readJsonBody(request);
  const rawEvents = Array.isArray(body.events) ? body.events : [body];
  const valid = [];

  for (const ev of rawEvents.slice(0, 20)) {
    if (!ev || typeof ev !== 'object') continue;
    const eventType = cleanStr(ev.event_type, 24);
    const sessionId = cleanStr(ev.session_id, 64);
    const path = cleanStr(ev.path, 200) || '/';
    if (!ALLOWED_EVENT_TYPES.has(eventType) || !sessionId) continue;
    if (path.toLowerCase().includes('admin')) continue;

    const target = cleanStr(ev.target, 160) || null;
    const category = cleanStr(ev.category, 40) || null;
    const durationMs = Math.max(0, Math.min(3600000, parseInt(ev.duration_ms, 10) || 0));
    const device = ['mobile', 'tablet', 'desktop'].includes(ev.device) ? ev.device : 'desktop';
    const referrer = cleanStr(ev.referrer, 120) || 'Directo';

    valid.push({ sessionId, eventType, path, target, category, durationMs, device, referrer });
  }

  if (!valid.length) {
    return jsonResponse({ ok: true, recorded: 0 });
  }

  const stmt = env.DB.prepare(
    `INSERT INTO analytics_events (session_id, event_type, path, target, category, duration_ms, device, referrer)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  await env.DB.batch(
    valid.map((e) =>
      stmt.bind(e.sessionId, e.eventType, e.path, e.target, e.category, e.durationMs, e.device, e.referrer)
    )
  );

  return jsonResponse({ ok: true, recorded: valid.length }, 201);
}

async function getAnalytics(url, env) {
  const rawDays = parseInt(url.searchParams.get('days'), 10);
  const days = [7, 30, 90, 365].includes(rawDays) ? rawDays : 30;
  const sinceModifier = `-${days} days`;

  const [
    summaryRow,
    durationRow,
    dailyRes,
    sectionsRes,
    clicksRes,
    pagesRes,
    devicesRes,
    referrersRes,
    recentRes,
  ] = await Promise.all([
    env.DB.prepare(
      `SELECT
         SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
         SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS total_clicks,
         SUM(CASE WHEN event_type = 'section_view' THEN 1 ELSE 0 END) AS section_views,
         COUNT(DISTINCT session_id) AS unique_sessions
       FROM analytics_events
       WHERE created_at >= datetime('now', ?)`
    )
      .bind(sinceModifier)
      .first(),

    env.DB.prepare(
      `SELECT AVG(session_ms) AS avg_ms, MAX(session_ms) AS max_ms
       FROM (
         SELECT session_id, SUM(duration_ms) AS session_ms
         FROM analytics_events
         WHERE event_type = 'duration' AND duration_ms > 0 AND created_at >= datetime('now', ?)
         GROUP BY session_id
       )`
    )
      .bind(sinceModifier)
      .first(),

    env.DB.prepare(
      `SELECT
         substr(created_at, 1, 10) AS day,
         SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
         SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS clicks,
         COUNT(DISTINCT session_id) AS sessions
       FROM analytics_events
       WHERE created_at >= datetime('now', ?)
       GROUP BY day
       ORDER BY day ASC`
    )
      .bind(sinceModifier)
      .all(),

    env.DB.prepare(
      `SELECT target, COUNT(*) AS views, COUNT(DISTINCT session_id) AS unique_views
       FROM analytics_events
       WHERE event_type = 'section_view' AND target IS NOT NULL AND created_at >= datetime('now', ?)
       GROUP BY target
       ORDER BY views DESC
       LIMIT 10`
    )
      .bind(sinceModifier)
      .all(),

    env.DB.prepare(
      `SELECT target, COALESCE(category, 'other') AS category, COUNT(*) AS clicks
       FROM analytics_events
       WHERE event_type = 'click' AND target IS NOT NULL AND created_at >= datetime('now', ?)
       GROUP BY target, category
       ORDER BY clicks DESC
       LIMIT 12`
    )
      .bind(sinceModifier)
      .all(),

    env.DB.prepare(
      `SELECT path, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
       FROM analytics_events
       WHERE event_type = 'pageview' AND created_at >= datetime('now', ?)
       GROUP BY path
       ORDER BY views DESC
       LIMIT 10`
    )
      .bind(sinceModifier)
      .all(),

    env.DB.prepare(
      `SELECT device, COUNT(DISTINCT session_id) AS sessions
       FROM analytics_events
       WHERE event_type = 'pageview' AND created_at >= datetime('now', ?)
       GROUP BY device
       ORDER BY sessions DESC`
    )
      .bind(sinceModifier)
      .all(),

    env.DB.prepare(
      `SELECT referrer, COUNT(DISTINCT session_id) AS sessions
       FROM analytics_events
       WHERE event_type = 'pageview' AND created_at >= datetime('now', ?)
       GROUP BY referrer
       ORDER BY sessions DESC
       LIMIT 8`
    )
      .bind(sinceModifier)
      .all(),

    env.DB.prepare(
      `SELECT id, event_type, path, target, category, duration_ms, device, referrer, created_at
       FROM analytics_events
       WHERE event_type != 'duration'
       ORDER BY id DESC
       LIMIT 15`
    ).all(),
  ]);

  const pageviews = Number(summaryRow?.pageviews || 0);
  const totalClicks = Number(summaryRow?.total_clicks || 0);
  const uniqueSessions = Number(summaryRow?.unique_sessions || 0);
  const avgDurationSec = Math.round(Number(durationRow?.avg_ms || 0) / 1000);
  const maxDurationSec = Math.round(Number(durationRow?.max_ms || 0) / 1000);

  return jsonResponse({
    days,
    summary: {
      pageviews,
      uniqueSessions,
      totalClicks,
      sectionViews: Number(summaryRow?.section_views || 0),
      avgDurationSec,
      maxDurationSec,
      clicksPerSession: uniqueSessions > 0 ? Number((totalClicks / uniqueSessions).toFixed(1)) : 0,
    },
    daily: dailyRes.results || [],
    topSections: sectionsRes.results || [],
    topClicks: clicksRes.results || [],
    topPages: pagesRes.results || [],
    devices: devicesRes.results || [],
    referrers: referrersRes.results || [],
    recentEvents: recentRes.results || [],
  });
}

async function resetAnalytics(env) {
  await env.DB.prepare('DELETE FROM analytics_events').run();
  return jsonResponse({ ok: true, message: 'Estadísticas reiniciadas' });
}

// ─── API Router ───────────────────────────────────────────────────────────────

async function handleApi(request, url, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const route = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  const method = request.method;

  // Legacy RPC-style routes used by admin.html, blog.html, and js/*-client.js
  switch (route) {
    case 'get-projects':
      return method === 'GET' ? getProjects(url, env, false) : methodNotAllowed();
    case 'get-project':
      return method === 'GET'
        ? getProject(url.searchParams.get('id'), env, false)
        : methodNotAllowed();
    case 'create-project':
      return method === 'POST' ? createProject(request, env, false) : methodNotAllowed();
    case 'update-project':
      return method === 'PUT' || method === 'PATCH'
        ? updateProject(request, env, null, false)
        : methodNotAllowed();
    case 'delete-project':
      return method === 'DELETE' ? deleteProject(request, env, null) : methodNotAllowed();
    case 'toggle-project-visibility':
      return method === 'PATCH' || method === 'PUT'
        ? toggleProjectVisibility(request, env)
        : methodNotAllowed();

    case 'get-posts':
      return method === 'GET' ? getPosts(url, env, false) : methodNotAllowed();
    case 'get-post':
      return method === 'GET'
        ? getPost(url.searchParams.get('id'), env, false)
        : methodNotAllowed();
    case 'create-post':
      return method === 'POST' ? createPost(request, env, false) : methodNotAllowed();
    case 'update-post':
      return method === 'PUT' || method === 'PATCH'
        ? updatePost(request, env, null, false)
        : methodNotAllowed();
    case 'delete-post':
      return method === 'DELETE' ? deletePost(request, env, null) : methodNotAllowed();
    case 'toggle-post-visibility':
      return method === 'PATCH' || method === 'PUT'
        ? togglePostVisibility(request, env)
        : methodNotAllowed();

    case 'get-todos':
      return method === 'GET' ? getTodos(url, env, false) : methodNotAllowed();
    case 'add-todo':
      return method === 'POST' ? createTodo(request, env, false) : methodNotAllowed();
    case 'update-todo':
      return method === 'PUT' || method === 'PATCH'
        ? updateTodo(request, env, null, false)
        : methodNotAllowed();
    case 'delete-todo':
      return method === 'DELETE' ? deleteTodo(request, env, null, false) : methodNotAllowed();

    case 'get-brand-works':
      return method === 'GET' ? getBrandWorks(url, env) : methodNotAllowed();
    case 'create-brand-work':
      return method === 'POST' ? createBrandWork(request, env) : methodNotAllowed();
    case 'update-brand-work':
      return method === 'PUT' || method === 'PATCH'
        ? updateBrandWork(request, env)
        : methodNotAllowed();
    case 'delete-brand-work':
      return method === 'DELETE' ? deleteBrandWork(request, env) : methodNotAllowed();

    case 'upload-image':
      return method === 'POST' ? uploadImageToR2(request, env) : methodNotAllowed();
    case 'version':
      return method === 'GET' ? handleVersion(env) : methodNotAllowed();
    case 'track':
      return method === 'POST' ? trackAnalytics(request, env) : methodNotAllowed();
    case 'analytics':
      if (method === 'GET') return getAnalytics(url, env);
      if (method === 'DELETE') return resetAnalytics(env);
      return methodNotAllowed();

    // RESTful collection routes
    case 'projects':
      if (method === 'GET') return getProjects(url, env, true);
      if (method === 'POST') return createProject(request, env, true);
      return methodNotAllowed();
    case 'posts':
      if (method === 'GET') return getPosts(url, env, true);
      if (method === 'POST') return createPost(request, env, true);
      return methodNotAllowed();
    case 'todos':
      if (method === 'GET') return getTodos(url, env, true);
      if (method === 'POST') return createTodo(request, env, true);
      return methodNotAllowed();
  }

  // RESTful item routes (/api/projects/:id, /api/posts/:id, /api/todos/:id)
  const segments = route.split('/');
  if (segments.length === 2) {
    const [resource, id] = segments;
    if (resource === 'projects') {
      if (method === 'GET') return getProject(id, env, true);
      if (method === 'PUT' || method === 'PATCH') return updateProject(request, env, id, true);
      if (method === 'DELETE') return deleteProject(request, env, id);
      return methodNotAllowed();
    }
    if (resource === 'posts') {
      if (method === 'GET') return getPost(id, env, true);
      if (method === 'PUT' || method === 'PATCH') return updatePost(request, env, id, true);
      if (method === 'DELETE') return deletePost(request, env, id);
      return methodNotAllowed();
    }
    if (resource === 'todos') {
      if (method === 'GET') return getTodo(id, env);
      if (method === 'PUT' || method === 'PATCH') return updateTodo(request, env, id, true);
      if (method === 'DELETE') return deleteTodo(request, env, id, true);
      return methodNotAllowed();
    }
  }

  return jsonResponse({ error: 'Endpoint not found' }, 404);
}

// ─── Worker Entrypoint ────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (url.pathname === '/health') {
        if (request.method === 'OPTIONS') {
          return new Response(null, { status: 204, headers: CORS_HEADERS });
        }
        return handleHealth(env);
      }

      if (url.pathname.startsWith('/api/')) {
        return handleApi(request, url, env);
      }

      if (url.pathname.startsWith('/media/')) {
        return serveMediaFromR2(url, env);
      }

      // Root route serves Index.html
      if (url.pathname === '/') {
        const indexUrl = new URL('/Index.html', url.origin);
        return env.ASSETS.fetch(new Request(indexUrl, request));
      }

      // Serve static assets from ./public
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status === 404) {
        const accept = request.headers.get('Accept') || '';
        if (accept.includes('text/html')) {
          const notFoundUrl = new URL('/404.html', url.origin);
          const notFoundResponse = await env.ASSETS.fetch(new Request(notFoundUrl, request));
          return new Response(notFoundResponse.body, {
            status: 404,
            headers: notFoundResponse.headers,
          });
        }
      }

      return assetResponse;
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  },
};
