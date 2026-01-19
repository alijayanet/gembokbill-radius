-- Migration: Add WhatsApp Group ID to technicians table
-- Date: 2024-01-01
-- Description: Add whatsapp_group_id column to technicians table for individual group management

-- Add whatsapp_group_id column to technicians table
ALTER TABLE technicians ADD COLUMN whatsapp_group_id TEXT;

-- Add index for whatsapp_group_id for faster queries
CREATE INDEX IF NOT EXISTS idx_technicians_whatsapp_group ON technicians(whatsapp_group_id);

-- Update existing technicians with default group from settings (if any)
-- This will be handled by the application logic

-- Add comment to document the column
-- whatsapp_group_id: WhatsApp Group ID (format: 120363xxxxx@g.us) for technician-specific notifications
