-- Update checkpoint names for Route 1 (SM Epza → SM Dasmariñas)
-- Based on the route, these should be the actual checkpoint names

UPDATE checkpoints SET checkpoint_name = 'SM Epza' WHERE id = 1 AND route_id = 1;
UPDATE checkpoints SET checkpoint_name = 'Robinson Tejero' WHERE id = 2 AND route_id = 1;
UPDATE checkpoints SET checkpoint_name = 'Robinson Pala-pala' WHERE id = 3 AND route_id = 1;
UPDATE checkpoints SET checkpoint_name = 'Riverside' WHERE id = 4 AND route_id = 1;
UPDATE checkpoints SET checkpoint_name = 'Lancaster New City' WHERE id = 5 AND route_id = 1;
UPDATE checkpoints SET checkpoint_name = 'Pasong Camachile I' WHERE id = 6 AND route_id = 1;
UPDATE checkpoints SET checkpoint_name = 'Open Canal' WHERE id = 7 AND route_id = 1;
UPDATE checkpoints SET checkpoint_name = 'Santiago' WHERE id = 8 AND route_id = 1;
UPDATE checkpoints SET checkpoint_name = 'Bella Vista' WHERE id = 9 AND route_id = 1;
UPDATE checkpoints SET checkpoint_name = 'San Francisco' WHERE id = 10 AND route_id = 1;
UPDATE checkpoints SET checkpoint_name = 'SM Dasmariñas' WHERE id = 11 AND route_id = 1;

-- Set origin and destination flags
UPDATE checkpoints SET is_origin = 1 WHERE id = 1 AND route_id = 1; -- SM Epza is origin
UPDATE checkpoints SET is_destination = 1 WHERE id = 11 AND route_id = 1; -- SM Dasmariñas is destination

-- Verify the updates
SELECT id, checkpoint_name, sequence_order, is_origin, is_destination FROM checkpoints WHERE route_id = 1 ORDER BY sequence_order;
