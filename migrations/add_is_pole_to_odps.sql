-- Migration: Add is_pole column to odps table
-- This allows ODPs to be marked as poles/tiang without ports

-- Add is_pole column to odps table
ALTER TABLE odps ADD COLUMN is_pole INTEGER DEFAULT 0;

-- Update existing ODPs to be non-pole (0) by default
UPDATE odps SET is_pole = 0 WHERE is_pole IS NULL;

-- Add comment for documentation
-- is_pole: 0 = normal ODP with ports, 1 = pole/tiang without ports
