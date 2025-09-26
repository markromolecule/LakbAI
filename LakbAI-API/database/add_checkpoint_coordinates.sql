-- =============================================
-- Add Coordinates to Checkpoints Table
-- =============================================

USE `lakbai_db`;

-- Add coordinates columns to checkpoints table
ALTER TABLE checkpoints 
ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL,
ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL;

-- Update with actual coordinates for all checkpoints
-- Route 1: SM Epza → SM Dasmariñas
UPDATE checkpoints SET latitude = 14.5995, longitude = 120.9842 WHERE checkpoint_name = 'SM Epza' AND route_id = 1;
UPDATE checkpoints SET latitude = 14.5800, longitude = 120.9800 WHERE checkpoint_name = 'Robinson Tejero' AND route_id = 1;
UPDATE checkpoints SET latitude = 14.5700, longitude = 120.9700 WHERE checkpoint_name = 'Malabon' AND route_id = 1;
UPDATE checkpoints SET latitude = 14.5600, longitude = 120.9600 WHERE checkpoint_name = 'Riverside' AND route_id = 1;
UPDATE checkpoints SET latitude = 14.5500, longitude = 120.9500 WHERE checkpoint_name = 'Lancaster New City' AND route_id = 1;
UPDATE checkpoints SET latitude = 14.5400, longitude = 120.9400 WHERE checkpoint_name = 'Pasong Camachile I' AND route_id = 1;
UPDATE checkpoints SET latitude = 14.5300, longitude = 120.9300 WHERE checkpoint_name = 'Open Canal' AND route_id = 1;
UPDATE checkpoints SET latitude = 14.5200, longitude = 120.9200 WHERE checkpoint_name = 'Santiago' AND route_id = 1;
UPDATE checkpoints SET latitude = 14.5100, longitude = 120.9100 WHERE checkpoint_name = 'Bella Vista' AND route_id = 1;
UPDATE checkpoints SET latitude = 14.5000, longitude = 120.9000 WHERE checkpoint_name = 'San Francisco' AND route_id = 1;
UPDATE checkpoints SET latitude = 14.4900, longitude = 120.8900 WHERE checkpoint_name = 'Country Meadow' AND route_id = 1;
UPDATE checkpoints SET latitude = 14.4800, longitude = 120.8800 WHERE checkpoint_name = 'Pabahay' AND route_id = 1;
UPDATE checkpoints SET latitude = 14.4700, longitude = 120.8700 WHERE checkpoint_name = 'Monterey' AND route_id = 1;
UPDATE checkpoints SET latitude = 14.4600, longitude = 120.8600 WHERE checkpoint_name = 'Langkaan' AND route_id = 1;
UPDATE checkpoints SET latitude = 14.4500, longitude = 120.8500 WHERE checkpoint_name = 'Tierra Vista' AND route_id = 1;
UPDATE checkpoints SET latitude = 14.4400, longitude = 120.8400 WHERE checkpoint_name = 'Robinson Dasmariñas' AND route_id = 1;
UPDATE checkpoints SET latitude = 14.3297, longitude = 120.9372 WHERE checkpoint_name = 'SM Dasmariñas' AND route_id = 1;

-- Route 2: SM Dasmariñas → SM Epza (reverse order)
UPDATE checkpoints SET latitude = 14.3297, longitude = 120.9372 WHERE checkpoint_name = 'SM Dasmariñas' AND route_id = 2;
UPDATE checkpoints SET latitude = 14.4400, longitude = 120.8400 WHERE checkpoint_name = 'Robinson Dasmariñas' AND route_id = 2;
UPDATE checkpoints SET latitude = 14.4500, longitude = 120.8500 WHERE checkpoint_name = 'Tierra Vista' AND route_id = 2;
UPDATE checkpoints SET latitude = 14.4600, longitude = 120.8600 WHERE checkpoint_name = 'Langkaan' AND route_id = 2;
UPDATE checkpoints SET latitude = 14.4700, longitude = 120.8700 WHERE checkpoint_name = 'Monterey' AND route_id = 2;
UPDATE checkpoints SET latitude = 14.4800, longitude = 120.8800 WHERE checkpoint_name = 'Pabahay' AND route_id = 2;
UPDATE checkpoints SET latitude = 14.4900, longitude = 120.8900 WHERE checkpoint_name = 'Country Meadow' AND route_id = 2;
UPDATE checkpoints SET latitude = 14.5000, longitude = 120.9000 WHERE checkpoint_name = 'San Francisco' AND route_id = 2;
UPDATE checkpoints SET latitude = 14.5100, longitude = 120.9100 WHERE checkpoint_name = 'Bella Vista' AND route_id = 2;
UPDATE checkpoints SET latitude = 14.5200, longitude = 120.9200 WHERE checkpoint_name = 'Santiago' AND route_id = 2;
UPDATE checkpoints SET latitude = 14.5300, longitude = 120.9300 WHERE checkpoint_name = 'Open Canal' AND route_id = 2;
UPDATE checkpoints SET latitude = 14.5400, longitude = 120.9400 WHERE checkpoint_name = 'Pasong Camachile I' AND route_id = 2;
UPDATE checkpoints SET latitude = 14.5500, longitude = 120.9500 WHERE checkpoint_name = 'Lancaster New City' AND route_id = 2;
UPDATE checkpoints SET latitude = 14.5600, longitude = 120.9600 WHERE checkpoint_name = 'Riverside' AND route_id = 2;
UPDATE checkpoints SET latitude = 14.5700, longitude = 120.9700 WHERE checkpoint_name = 'Malabon' AND route_id = 2;
UPDATE checkpoints SET latitude = 14.5800, longitude = 120.9800 WHERE checkpoint_name = 'Robinson Tejero' AND route_id = 2;
UPDATE checkpoints SET latitude = 14.5995, longitude = 120.9842 WHERE checkpoint_name = 'SM Epza' AND route_id = 2;

-- Verify the updates
SELECT 
    c.id,
    c.checkpoint_name,
    c.route_id,
    r.route_name,
    c.sequence_order,
    c.latitude,
    c.longitude,
    c.is_origin,
    c.is_destination
FROM checkpoints c
JOIN routes r ON c.route_id = r.id
WHERE c.status = 'active'
ORDER BY c.route_id, c.sequence_order;

-- Add index for better performance on coordinate lookups
CREATE INDEX idx_checkpoint_coordinates ON checkpoints (latitude, longitude);
CREATE INDEX idx_checkpoint_name_coords ON checkpoints (checkpoint_name, latitude, longitude);

-- Add comments to the table
ALTER TABLE checkpoints COMMENT = 'Checkpoints with GPS coordinates for map integration';
