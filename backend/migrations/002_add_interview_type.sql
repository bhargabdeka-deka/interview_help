-- Add type column to interviews (coding | system-design)
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'coding';

-- Backfill existing rows to 'coding'
UPDATE interviews SET type = 'coding' WHERE type IS NULL OR type = '';
