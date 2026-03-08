-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    technologies TEXT[],
    image_url VARCHAR(500),
    project_url VARCHAR(500),
    github_url VARCHAR(500),
    category VARCHAR(100),
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create posts (blog) table
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL DEFAULT 'Agustín Stoppello',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    task TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at DESC);

-- Insert sample projects
INSERT INTO projects (title, description, technologies, image_url, project_url, github_url, category, featured) VALUES
    ('LlegaRapido', 'Rediseño de plataforma y página web de delivery con geolocalización y sistema de pedidos', ARRAY['Figma', 'HTML', 'CSS', 'Bootstrap'], '/imag/Portada LlegaRapido Iphone.jpg', '/Proyects/Llegarapido.html', NULL, 'UX/UI', true),
    ('SmartTechs', 'Construcción de identidad de marca y desarrollo de página web para empresa de tecnología', ARRAY['Figma', 'HTML', 'CSS', 'Bootstrap'], '/imag/Portada Smart Techs PC.jpg', '/Proyects/Smartechs.html', NULL, 'Branding', true),
    ('Taquitos', 'Landing page para restaurante con reservas online y carta digital', ARRAY['HTML', 'CSS', 'Bootstrap'], '/imag/Taquitos.jpg', '/Proyects/Taquitos.html', NULL, 'Landing Page', false)
ON CONFLICT DO NOTHING;

-- Insert sample blog posts
INSERT INTO posts (title, content, author) VALUES
    ('Principios de UX que todo diseñador debe conocer', 'El diseño centrado en el usuario es la base de cualquier experiencia digital exitosa. En este artículo repaso los principios fundamentales de UX que aplico en cada proyecto: jerarquía visual, consistencia, retroalimentación inmediata y accesibilidad.', 'Agustín Stoppello'),
    ('Cómo construir un sistema de diseño desde cero', 'Un sistema de diseño es mucho más que una guía de estilos. Es un lenguaje compartido entre diseñadores y desarrolladores. Comparto mi proceso para crear sistemas de diseño escalables usando Figma y tokens de diseño.', 'Agustín Stoppello')
ON CONFLICT DO NOTHING;

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
