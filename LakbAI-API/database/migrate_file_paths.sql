-- =============================================
-- File Path Migration Script
-- Updates existing file paths from old structure to new structure
-- =============================================

USE `lakbai_db`;

-- Update discount document paths from uploads/discounts/ to uploads/
UPDATE `users` 
SET `discount_document_path` = REPLACE(`discount_document_path`, 'uploads/discounts/', 'uploads/')
WHERE `discount_document_path` LIKE 'uploads/discounts/%';

-- Update any other file paths that might reference the old structure
-- (This is a safety measure in case there are other tables with file paths)

-- Show the results of the migration
SELECT 
    id, 
    username, 
    discount_document_path,
    discount_document_name
FROM `users` 
WHERE `discount_document_path` IS NOT NULL 
AND `discount_document_path` != '';

-- Count how many records were updated
SELECT 
    COUNT(*) as total_discount_documents,
    SUM(CASE WHEN discount_document_path LIKE 'uploads/%' THEN 1 ELSE 0 END) as updated_paths,
    SUM(CASE WHEN discount_document_path LIKE 'uploads/discounts/%' THEN 1 ELSE 0 END) as old_paths_remaining
FROM `users` 
WHERE `discount_document_path` IS NOT NULL;
