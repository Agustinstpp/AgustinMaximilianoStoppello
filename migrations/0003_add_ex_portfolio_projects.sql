-- Migration 0003: Import projects and covers from ex-portfolio (agustinstoppello.netlify.app)

INSERT INTO projects (title, description, technologies, image_url, project_url, github_url, category, featured, created_at)
SELECT 'LlegaRapido', 'Rediseño completo de plataforma y página web con enfoque en usabilidad y pedidos online.', '["UX/UI","Figma","Desarrollo Web"]', '/imag/Portada LlegaRapido PC.jpg', '/Proyects/Llegarapido.html', NULL, 'UX/UI · WEB APP', 1, '2026-11-19 12:00:00'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'LlegaRapido');

INSERT INTO projects (title, description, technologies, image_url, project_url, github_url, category, featured, created_at)
SELECT 'Smart Techs', 'Proyecto integral de marketing, identidad visual y desarrollo web para agencia de tecnología.', '["Branding","Marketing","Desarrollo Web"]', '/imag/Portada Smart Techs PC.jpg', '/Proyects/Smartechs.html', NULL, 'BRANDING · WEB', 1, '2026-11-18 12:00:00'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Smart Techs');

INSERT INTO projects (title, description, technologies, image_url, project_url, github_url, category, featured, created_at)
SELECT 'Puerto Pirayú', 'Identidad de marca y piezas gráficas para turismo local en Misiones, Argentina.', '["Branding","Diseño Gráfico","Identidad"]', '/imag/Portada puerto del pirayu.jpg', NULL, NULL, 'MARCA · TURISMO', 0, '2026-11-17 12:00:00'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Puerto Pirayú');

INSERT INTO projects (title, description, technologies, image_url, project_url, github_url, category, featured, created_at)
SELECT 'Suhka | Salón de Belleza', 'Branding y presencia digital integral para salón de belleza en Corrientes.', '["Branding","Social Media","Diseño"]', '/imag/Portada Sukha.jpg', NULL, NULL, 'BRANDING · DIGITAL', 0, '2026-11-16 12:00:00'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Suhka | Salón de Belleza');
