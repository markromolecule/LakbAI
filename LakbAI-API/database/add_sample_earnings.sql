-- =============================================
-- Add Sample Earnings Data for Testing
-- =============================================

USE `lakbai_db`;

-- Clear existing sample data
DELETE FROM `driver_earnings` WHERE `trip_id` LIKE 'trip_sample_%';

-- Insert comprehensive sample earnings data for today
INSERT INTO `driver_earnings` (
    `driver_id`, `trip_id`, `passenger_id`, `amount`, `original_fare`, 
    `discount_amount`, `final_fare`, `counts_as_trip`, `payment_method`, 
    `pickup_location`, `destination`, `transaction_date`, `created_at`
) VALUES
-- Driver 16 (assuming this driver exists)
(16, 'trip_sample_001', 'passenger_001', 25.00, 30.00, 5.00, 25.00, 1, 'xendit', 'Robinson Tejero', 'SM Dasmariñas', CURDATE(), NOW()),
(16, 'trip_sample_002', 'passenger_002', 15.00, 15.00, 0.00, 15.00, 1, 'xendit', 'SM Epza', 'Robinson Tejero', CURDATE(), NOW()),
(16, 'trip_sample_003', 'passenger_003', 20.00, 20.00, 0.00, 20.00, 1, 'xendit', 'Malabon', 'Riverside', CURDATE(), NOW()),
(16, 'trip_sample_004', 'passenger_004', 35.00, 40.00, 5.00, 35.00, 1, 'xendit', 'Lancaster New City', 'SM Dasmariñas', CURDATE(), NOW()),
(16, 'trip_sample_005', 'passenger_005', 18.00, 18.00, 0.00, 18.00, 1, 'xendit', 'Santiago', 'Bella Vista', CURDATE(), NOW()),

-- Driver 17 (assuming this driver exists)
(17, 'trip_sample_006', 'passenger_006', 22.00, 25.00, 3.00, 22.00, 1, 'xendit', 'SM Dasmariñas', 'Robinson Tejero', CURDATE(), NOW()),
(17, 'trip_sample_007', 'passenger_007', 28.00, 30.00, 2.00, 28.00, 1, 'xendit', 'Riverside', 'Lancaster New City', CURDATE(), NOW()),
(17, 'trip_sample_008', 'passenger_008', 16.00, 16.00, 0.00, 16.00, 1, 'xendit', 'Bella Vista', 'San Francisco', CURDATE(), NOW()),
(17, 'trip_sample_009', 'passenger_009', 32.00, 35.00, 3.00, 32.00, 1, 'xendit', 'Country Meadow', 'SM Dasmariñas', CURDATE(), NOW()),

-- Driver 18 (assuming this driver exists)
(18, 'trip_sample_010', 'passenger_010', 24.00, 24.00, 0.00, 24.00, 1, 'xendit', 'Pabahay', 'Monterey', CURDATE(), NOW()),
(18, 'trip_sample_011', 'passenger_011', 19.00, 22.00, 3.00, 19.00, 1, 'xendit', 'Langkaan', 'Tierra Vista', CURDATE(), NOW()),
(18, 'trip_sample_012', 'passenger_012', 26.00, 26.00, 0.00, 26.00, 1, 'xendit', 'Robinson Dasmariñas', 'SM Dasmariñas', CURDATE(), NOW()),

-- Add some earnings from different hours to test hourly breakdown
(16, 'trip_sample_013', 'passenger_013', 30.00, 30.00, 0.00, 30.00, 1, 'xendit', 'SM Epza', 'SM Dasmariñas', CURDATE(), DATE_ADD(NOW(), INTERVAL -2 HOUR)),
(17, 'trip_sample_014', 'passenger_014', 25.00, 25.00, 0.00, 25.00, 1, 'xendit', 'Robinson Tejero', 'Malabon', CURDATE(), DATE_ADD(NOW(), INTERVAL -1 HOUR)),
(18, 'trip_sample_015', 'passenger_015', 21.00, 21.00, 0.00, 21.00, 1, 'xendit', 'Riverside', 'Lancaster New City', CURDATE(), DATE_ADD(NOW(), INTERVAL -30 MINUTE));

-- Show the inserted data
SELECT 
    de.driver_id,
    u.first_name,
    u.last_name,
    de.trip_id,
    de.final_fare,
    de.counts_as_trip,
    de.transaction_date,
    de.created_at
FROM driver_earnings de
LEFT JOIN users u ON de.driver_id = u.id
WHERE de.trip_id LIKE 'trip_sample_%'
ORDER BY de.created_at DESC;

-- Show daily summary
SELECT 
    COUNT(DISTINCT driver_id) as total_drivers,
    COUNT(CASE WHEN counts_as_trip = 1 THEN 1 END) as total_trips,
    SUM(final_fare) as total_revenue,
    AVG(final_fare) as average_fare,
    SUM(discount_amount) as total_discounts
FROM driver_earnings 
WHERE transaction_date = CURDATE();
