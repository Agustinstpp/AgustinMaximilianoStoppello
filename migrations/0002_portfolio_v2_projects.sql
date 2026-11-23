-- Migration 0002: Update selected works for Portfolio v2 (agustinst.code)

DELETE FROM projects WHERE title IN ('LlegaRapido', 'SmartTechs', 'Taquitos');

INSERT INTO projects (title, description, technologies, image_url, project_url, github_url, category, featured, created_at)
SELECT 'Puma, TCL, Wampa y más', 'Contenido visual, estrategia y campañas digitales para marcas líderes.', '["Marketing","Contenido","Estrategia"]', NULL, NULL, NULL, 'MARKETING · MARCAS', 1, '2026-11-20 12:00:00'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Puma, TCL, Wampa y más');

INSERT INTO projects (title, description, technologies, image_url, project_url, github_url, category, featured, created_at)
SELECT 'Doble y Falta Streaming', 'Identidad y redes del programa de básquet local de Corrientes.', '["Branding","Streaming","Redes"]', NULL, NULL, NULL, 'CONTENIDO · STREAMING', 1, '2026-11-21 12:00:00'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Doble y Falta Streaming');

INSERT INTO projects (title, description, technologies, image_url, project_url, github_url, category, featured, created_at)
SELECT 'YacaJobs', 'Identidad con yacaré y casco naranja, y manual de marca completo.', '["Branding","Identidad","Manual de marca"]', NULL, NULL, NULL, 'MARCA · BRANDING', 1, '2026-11-22 12:00:00'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'YacaJobs');

INSERT INTO projects (title, description, technologies, image_url, project_url, github_url, category, featured, created_at)
SELECT 'Club Don Bosco Corrientes', 'Plataforma digital integral del club con gestión institucional y experiencia optimizada para socios.', '["Desarrollo Web","UX/UI","Cloudflare"]', NULL, NULL, NULL, 'PLATAFORMA WEB · DISEÑO', 1, '2026-11-23 12:00:00'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Club Don Bosco Corrientes');
