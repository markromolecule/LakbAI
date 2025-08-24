/**
 * File Utility Functions
 * Contains utilities for file handling and validation
 */

import { FILE_UPLOAD, ERROR_MESSAGES } from '../helpers/constants';

/**
 * Validate uploaded file
 * @param {File} file - File to validate
 * @returns {object} Validation result with isValid and error message
 */
export const validateFile = (file) => {
  if (!file) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED.DRIVERS_LICENSE };
  }

  // Check file type
  if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.type)) {
    return { 
      isValid: false, 
      error: ERROR_MESSAGES.FILE_UPLOAD.INVALID_TYPE 
    };
  }

  // Check file size
  if (file.size > FILE_UPLOAD.MAX_SIZE) {
    return { 
      isValid: false, 
      error: ERROR_MESSAGES.FILE_UPLOAD.FILE_TOO_LARGE 
    };
  }

  return { isValid: true, error: null };
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 * @param {string} filename - Name of the file
 * @returns {string} File extension
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Check if file is an image
 * @param {File} file - File to check
 * @returns {boolean} True if file is an image
 */
export const isImageFile = (file) => {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  return imageTypes.includes(file.type);
};

/**
 * Check if file is a PDF
 * @param {File} file - File to check
 * @returns {boolean} True if file is a PDF
 */
export const isPdfFile = (file) => {
  return file.type === 'application/pdf';
};

/**
 * Create a preview URL for image files
 * @param {File} file - Image file
 * @returns {string|null} Object URL for preview or null if not an image
 */
export const createImagePreview = (file) => {
  if (!isImageFile(file)) return null;
  return URL.createObjectURL(file);
};

/**
 * Clean up object URL to prevent memory leaks
 * @param {string} url - Object URL to revoke
 */
export const revokeObjectURL = (url) => {
  if (url) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Generate safe filename
 * @param {string} originalName - Original filename
 * @param {string} prefix - Optional prefix
 * @returns {string} Safe filename
 */
export const generateSafeFilename = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const extension = getFileExtension(originalName);
  const safeName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();
  
  return prefix ? `${prefix}_${timestamp}_${safeName}` : `${timestamp}_${safeName}`;
};
