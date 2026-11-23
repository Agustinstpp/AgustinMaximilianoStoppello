-- Migration 0006: Add rich case-study content & demo_url to projects, and cover/summary/tags to posts

ALTER TABLE projects ADD COLUMN content TEXT;
ALTER TABLE projects ADD COLUMN demo_url TEXT;

ALTER TABLE posts ADD COLUMN cover_url TEXT;
ALTER TABLE posts ADD COLUMN summary TEXT;
ALTER TABLE posts ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
