-- Migration: Add join_date column to technicians table
-- Date: 2025-10-21
-- Description: Add join_date column to technicians table for tracking technician joining date

-- Add join_date column to technicians table (without default value first)
ALTER TABLE technicians ADD COLUMN join_date DATETIME;

-- Update existing technicians with current timestamp as join_date
UPDATE technicians SET join_date = datetime('now') WHERE join_date IS NULL;

-- Add comment to document the column
-- join_date: Technician joining date for tracking employment start date