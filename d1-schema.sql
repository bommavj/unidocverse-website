wrangler d1 execute unidocverse-db --command="
DROP TABLE IF EXISTS testimonials;

CREATE TABLE testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    company TEXT,
    quote TEXT NOT NULL,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    approved INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    approved_at TEXT,
    approved_by TEXT,
    display_order INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0
);

CREATE INDEX idx_testimonials_approved ON testimonials(approved, display_order);
CREATE INDEX idx_testimonials_created ON testimonials(created_at DESC);

INSERT INTO testimonials (name, email, role, company, quote, rating, approved, approved_at, display_order, is_featured) VALUES
('Sarah Martinez', 'sarah.m@example.com', 'Compliance Director', 'Regional Bank', 'We process thousands of sensitive financial documents monthly. Every cloud-based AI tool we evaluated was a compliance nightmare — GDPR violations waiting to happen. UniDocVerse solved this instantly. Zero data leaves our network, 100% audit-friendly, and our legal team actually approved it. The semantic search alone saved us 15 hours per week.', 5, 1, datetime('now'), 1, 1),
('James Chen', 'james.c@example.com', 'Senior Legal Counsel', 'Tech Startup', 'The entity linking feature is remarkable. We had contracts scattered across multiple folders referencing overlapping parties and clauses. UniDocVerse automatically connected everything — found relationships we had missed in 6 months of manual review. Feels like having a junior associate who actually reads every document.', 5, 1, datetime('now'), 2, 1),
('Dr. Maya Patel', 'maya.p@example.com', 'Director of Clinical Operations', 'Medical Practice', 'HIPAA compliance killed every AI tool we tried. Patient records cannot touch the cloud — period. UniDocVerse processes everything locally. Our compliance officer signed off in one meeting. Now we analyze patient histories, lab results, and insurance docs without privacy risk. Game-changer for healthcare.', 5, 1, datetime('now'), 3, 1);
"