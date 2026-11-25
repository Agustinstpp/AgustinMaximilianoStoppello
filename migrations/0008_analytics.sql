-- Migration 0008: Built-in privacy-friendly analytics (pageviews, clicks, section views, duration)
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  path TEXT NOT NULL,
  target TEXT,
  category TEXT,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  device TEXT NOT NULL DEFAULT 'desktop',
  referrer TEXT NOT NULL DEFAULT 'Directo',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_type_created ON analytics_events (event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events (session_id);
