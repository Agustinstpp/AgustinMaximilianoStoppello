-- Migration 0007: Add is_visible flag to projects and posts so items can be hidden/shown from /admin.html

ALTER TABLE projects ADD COLUMN is_visible INTEGER NOT NULL DEFAULT 1;
ALTER TABLE posts ADD COLUMN is_visible INTEGER NOT NULL DEFAULT 1;
