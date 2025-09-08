-- =============================================
-- Update Jeepney Table - Make driver_id Optional
-- =============================================

USE `lakbai_db`;

-- Make driver_id column nullable
ALTER TABLE `jeepneys` MODIFY COLUMN `driver_id` INT(11) NULL;

-- Update foreign key constraint to allow NULL values
ALTER TABLE `jeepneys` DROP FOREIGN KEY `fk_driver`;
ALTER TABLE `jeepneys` ADD CONSTRAINT `fk_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE;
