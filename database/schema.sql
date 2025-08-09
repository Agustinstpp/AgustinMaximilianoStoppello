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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Insert sample projects
INSERT INTO projects (title, description, technologies, image_url, project_url, github_url, category, featured) VALUES
    ('LlegaRapido', 'Aplicación de delivery con geolocalización y sistema de pedidos en tiempo real', ARRAY['React', 'Node.js', 'PostgreSQL', 'Google Maps API'], '/imag/PortadaLlegarapido.jpg', 'https://llegarapido.netlify.app', 'https://github.com/username/llegarapido', 'Web App', true),
    ('Smartechs', 'E-commerce moderno con carrito de compras y pasarela de pagos', ARRAY['Next.js', 'Stripe', 'Tailwind CSS', 'PostgreSQL'], '/imag/Portada Smart Techs PC.jpg', 'https://smartechs.netlify.app', 'https://github.com/username/smartechs', 'E-commerce', true),
    ('Taquitos', 'Landing page para restaurante con reservas online', ARRAY['HTML', 'CSS', 'JavaScript', 'Bootstrap'], '/imag/Taquitos.jpg', 'https://taquitos.netlify.app', 'https://github.com/username/taquitos', 'Landing Page', false);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
