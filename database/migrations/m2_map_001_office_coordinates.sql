-- Module 2 / FR3 (Mahi): office coordinates for the interactive map.
-- Coordinates are approximate and can be corrected in Admin > Edit office.
ALTER TABLE offices
  ADD COLUMN latitude  DECIMAL(9,6) NULL AFTER contact_info,
  ADD COLUMN longitude DECIMAL(9,6) NULL AFTER latitude;

ALTER TABLE offices ADD INDEX idx_office_coords (latitude, longitude);

UPDATE offices SET latitude = 23.779200, longitude = 90.379600
  WHERE name = 'Regional Passport Office, Dhaka' AND latitude IS NULL;
UPDATE offices SET latitude = 23.806900, longitude = 90.368700
  WHERE name = 'BRTA Dhaka Metro Circle' AND latitude IS NULL;
UPDATE offices SET latitude = 23.858300, longitude = 90.266700
  WHERE name = 'Savar Upazila Land Office' AND latitude IS NULL;
