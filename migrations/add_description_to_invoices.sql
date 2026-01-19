-- Migration: Add description column to invoices table
-- Date: 2025-01-27
-- Description: Add description column for storing invoice descriptions

ALTER TABLE invoices ADD COLUMN description TEXT NULL;
