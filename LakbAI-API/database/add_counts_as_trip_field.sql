-- =============================================
-- Add counts_as_trip field to driver_earnings table
-- =============================================

USE `lakbai_db`;

-- Add the counts_as_trip field to track whether this earnings record should count as a trip
ALTER TABLE `driver_earnings` 
ADD COLUMN `counts_as_trip` TINYINT(1) NOT NULL DEFAULT 0 
COMMENT 'Whether this earnings record should count as a completed trip (1) or just payment (0)'
AFTER `final_fare`;

-- Update existing records: 
-- Assume existing records are trip completions (to maintain current trip counts)
UPDATE `driver_earnings` SET `counts_as_trip` = 1 WHERE `counts_as_trip` = 0;

-- Create index for performance on the new field
CREATE INDEX `idx_driver_trip_count` ON `driver_earnings` (`driver_id`, `counts_as_trip`, `transaction_date`);

-- Show the updated table structure
DESCRIBE `driver_earnings`;
