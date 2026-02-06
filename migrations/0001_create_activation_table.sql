-- Activation table for UniDocVerse licensing
CREATE TABLE IF NOT EXISTS activations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_key TEXT NOT NULL,
    device_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    activated_at TEXT NOT NULL,
    expiry_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_activation_license_key
    ON activations(license_key);

CREATE INDEX IF NOT EXISTS idx_activation_device
    ON activations(device_id);

CREATE INDEX IF NOT EXISTS idx_activation_version
    ON activations(license_key, version);
