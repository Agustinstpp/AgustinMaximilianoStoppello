-- Migration 0001: Initial Cloudflare D1 (SQLite) schema

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    technologies TEXT NOT NULL DEFAULT '[]',
    image_url TEXT,
    project_url TEXT,
    github_url TEXT,
    category TEXT,
    featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'Agustín Stoppello',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT NOT NULL,
    is_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at DESC);

-- Seed sample projects (only if table is empty)
INSERT INTO projects (title, description, technologies, image_url, project_url, github_url, category, featured)
SELECT 'LlegaRapido', 'Rediseño de plataforma y página web de delivery con geolocalización y sistema de pedidos', '["Figma","HTML","CSS","Bootstrap"]', '/imag/Portada LlegaRapido Iphone.jpg', '/Proyects/Llegarapido.html', NULL, 'UX/UI', 1
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'LlegaRapido');

INSERT INTO projects (title, description, technologies, image_url, project_url, github_url, category, featured)
SELECT 'SmartTechs', 'Construcción de identidad de marca y desarrollo de página web para empresa de tecnología', '["Figma","HTML","CSS","Bootstrap"]', '/imag/Portada Smart Techs PC.jpg', '/Proyects/Smartechs.html', NULL, 'Branding', 1
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'SmartTechs');

INSERT INTO projects (title, description, technologies, image_url, project_url, github_url, category, featured)
SELECT 'Taquitos', 'Landing page para restaurante con reservas online y carta digital', '["HTML","CSS","Bootstrap"]', '/imag/Taquitos.jpg', '/Proyects/Taquitos.html', NULL, 'Landing Page', 0
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Taquitos');

-- Seed sample blog posts (only if not present)
INSERT INTO posts (title, content, author)
SELECT 'Principios de UX que todo diseñador debe conocer', 'El diseño centrado en el usuario es la base de cualquier experiencia digital exitosa. En este artículo repaso los principios fundamentales de UX que aplico en cada proyecto: jerarquía visual, consistencia, retroalimentación inmediata y accesibilidad.', 'Agustín Stoppello'
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Principios de UX que todo diseñador debe conocer');

INSERT INTO posts (title, content, author)
SELECT 'Cómo construir un sistema de diseño desde cero', 'Un sistema de diseño es mucho más que una guía de estilos. Es un lenguaje compartido entre diseñadores y desarrolladores. Comparto mi proceso para crear sistemas de diseño escalables usando Figma y tokens de diseño.', 'Agustín Stoppello'
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Cómo construir un sistema de diseño desde cero');
