-- Activation table for UniDocVerse licensing
CREATE TABLE IF NOT EXISTS activations ( license_key TEXT PRIMARY KEY, device_id TEXT NOT NULL, activated_at TEXT NOT NULL, expiry_at TEXT NOT NULL );