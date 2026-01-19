-- Add hotspot_profile column to voucher_pricing table
ALTER TABLE voucher_pricing ADD COLUMN hotspot_profile TEXT;

-- Update existing records with default profile if needed
UPDATE voucher_pricing SET hotspot_profile = 'default' WHERE hotspot_profile IS NULL;
