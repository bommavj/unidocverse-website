-- Downloads tracking table
-- Run: wrangler d1 execute unidocverse-db --remote --file=create-downloads.sql

CREATE TABLE IF NOT EXISTS downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT,
    user_agent TEXT,
    referrer TEXT,
    country TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_downloads_created ON downloads(created_at DESC);

-- Summary table: stores running total (avoids counting rows every time)
CREATE TABLE IF NOT EXISTS download_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    total_downloads INTEGER DEFAULT 0,
    last_updated TEXT DEFAULT (datetime('now'))
);

-- Seed with initial row
INSERT OR IGNORE INTO download_stats (id, total_downloads) VALUES (1, 0);