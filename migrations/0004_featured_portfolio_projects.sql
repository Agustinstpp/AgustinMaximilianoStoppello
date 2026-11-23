-- Migration 0004: Feature YacaJobs, Doble y Falta, and Smart Techs on homepage

UPDATE projects SET featured = 0;

UPDATE projects
SET title = 'Doble y Falta',
    featured = 1,
    created_at = '2026-11-22 12:00:00'
WHERE title IN ('Doble y Falta', 'Doble y Falta Streaming');

UPDATE projects
SET featured = 1,
    created_at = '2026-11-23 12:00:00'
WHERE title = 'YacaJobs';

UPDATE projects
SET featured = 1,
    created_at = '2026-11-21 12:00:00'
WHERE title = 'Smart Techs';
