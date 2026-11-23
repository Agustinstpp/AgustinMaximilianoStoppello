-- Migration 0005: Add brand_works table for interactive brand carousel managed via /admin.html

CREATE TABLE IF NOT EXISTS brand_works (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    tag TEXT NOT NULL DEFAULT 'DISEÑO · DESARROLLO',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_brand_works_brand ON brand_works(brand);

INSERT INTO brand_works (brand, tag, title, description, url)
SELECT 'Club Don Bosco', 'PLATAFORMA WEB · DISEÑO', 'Plataforma web Club Don Bosco Corrientes', 'Diseño y desarrollo de la plataforma web del club con gestión institucional, información de disciplinas y experiencia optimizada para socios.', NULL
WHERE NOT EXISTS (SELECT 1 FROM brand_works WHERE brand = 'Club Don Bosco');

INSERT INTO brand_works (brand, tag, title, description, url)
SELECT 'TCL', 'DISEÑO · CONTENIDO', '[TÍTULO DEL TRABAJO CON TCL]', '[COMPLETAR: Describí qué hiciste para TCL, piezas o resultado obtenido.]', NULL
WHERE NOT EXISTS (SELECT 1 FROM brand_works WHERE brand = 'TCL');

INSERT INTO brand_works (brand, tag, title, description, url)
SELECT 'Wampa', 'DISEÑO · MARCA', '[TÍTULO DEL TRABAJO CON WAMPA]', '[COMPLETAR: Describí qué hiciste para Wampa y el impacto del trabajo.]', NULL
WHERE NOT EXISTS (SELECT 1 FROM brand_works WHERE brand = 'Wampa');

INSERT INTO brand_works (brand, tag, title, description, url)
SELECT 'ZenFit', 'PRODUCTO · UX/UI', '[TÍTULO DEL TRABAJO CON ZENFIT]', '[COMPLETAR: Describí qué hiciste para ZenFit.]', NULL
WHERE NOT EXISTS (SELECT 1 FROM brand_works WHERE brand = 'ZenFit');

INSERT INTO brand_works (brand, tag, title, description, url)
SELECT 'Puma', 'DISEÑO · CONTENIDO', '[TÍTULO DEL TRABAJO CON PUMA]', '[COMPLETAR: Describí las piezas o contenido realizado para Puma.]', NULL
WHERE NOT EXISTS (SELECT 1 FROM brand_works WHERE brand = 'Puma');

INSERT INTO brand_works (brand, tag, title, description, url)
SELECT 'Patagonia', 'CONTENIDO · MARCA', '[TÍTULO DEL TRABAJO CON PATAGONIA]', '[COMPLETAR: Describí qué hiciste para Patagonia.]', NULL
WHERE NOT EXISTS (SELECT 1 FROM brand_works WHERE brand = 'Patagonia');
