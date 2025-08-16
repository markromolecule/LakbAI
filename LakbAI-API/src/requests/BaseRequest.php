<?php

require_once __DIR__ . '/../helpers/ValidationHelper.php';

abstract class BaseRequest {
    protected $data;
    protected $validationHelper;
    protected $errors = [];

    public function __construct($data, $validationHelper) {
        $this->data = $data;
        $this->validationHelper = $validationHelper;
    }

    /**
     * Get all data
     */
    public function all() {
        return $this->data;
    }

    /**
     * Get specific field
     */
    public function get($key, $default = null) {
        return isset($this->data[$key]) ? $this->data[$key] : $default;
    }

    /**
     * Check if field exists
     */
    public function has($key) {
        return isset($this->data[$key]);
    }

    /**
     * Validate the request
     */
    abstract public function validate();

    /**
     * Get validation errors
     */
    public function getErrors() {
        return $this->errors;
    }

    /**
     * Check if validation passed
     */
    public function isValid() {
        return empty($this->errors);
    }

    /**
     * Add validation error
     */
    protected function addError($field, $message) {
        if (!isset($this->errors[$field])) {
            $this->errors[$field] = [];
        }
        $this->errors[$field][] = $message;
    }

    /**
     * Sanitize input data
     */
    protected function sanitizeData() {
        $sanitized = [];
        foreach ($this->data as $key => $value) {
            if (is_string($value)) {
                $sanitized[$key] = $this->validationHelper->sanitizeInput($value);
            } else {
                $sanitized[$key] = $value;
            }
        }
        $this->data = $sanitized;
    }

    /**
     * Get validated data
     */
    public function validated() {
        if (!$this->isValid()) {
            throw new Exception("Cannot get validated data. Request has validation errors.");
        }
        return $this->data;
    }
}
?>
